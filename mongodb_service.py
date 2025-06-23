"""
MongoDB service for storing and retrieving agent reports.
"""

import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import MONGODB_CONFIG

logger = logging.getLogger(__name__)


class MongoDBService:
    """Service class for MongoDB operations."""

    def __init__(self):
        """Initialize MongoDB connection."""
        self.client = None
        self.db = None
        self.reports_collection = None
        self.agents_collection = None
        self._connect()

    def _connect(self):
        """Establish connection to MongoDB."""
        try:
            self.client = MongoClient(
                MONGODB_CONFIG["connection_string"],
                serverSelectionTimeoutMS=MONGODB_CONFIG["connection_timeout"],
                maxPoolSize=MONGODB_CONFIG["max_pool_size"]
            )

            # Test connection
            self.client.admin.command('ping')

            # Get database and collections
            self.db = self.client[MONGODB_CONFIG["database_name"]]
            self.reports_collection = self.db[MONGODB_CONFIG["collection_name"]]
            self.agents_collection = self.db[MONGODB_CONFIG["agents_collection"]]

            # Create indexes for better performance
            self._create_indexes()

            logger.info("Connected to MongoDB successfully")

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def _create_indexes(self):
        """Create database indexes for better query performance."""
        try:
            # Indexes for reports collection
            self.reports_collection.create_index([("timestamp", DESCENDING)])
            self.reports_collection.create_index([("task_id", ASCENDING)])
            self.reports_collection.create_index([("all_agents.agent_name", ASCENDING)])
            self.reports_collection.create_index([("all_agents.agent_number", ASCENDING)])

            # Compound index for efficient agent queries
            self.reports_collection.create_index([
                ("timestamp", DESCENDING),
                ("all_agents.agent_name", ASCENDING)
            ])

            # Indexes for agents collection
            self.agents_collection.create_index([("agent_name", ASCENDING)], unique=True)
            self.agents_collection.create_index([("agent_number", ASCENDING)])
            self.agents_collection.create_index([("last_updated", DESCENDING)])

            logger.info("Database indexes created successfully")

        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

    def _serialize_mongodb_doc(self, doc):
        """Convert MongoDB document to JSON-serializable format."""
        if isinstance(doc, dict):
            return {
                key: (str(value) if isinstance(value, ObjectId)
                      else self._serialize_mongodb_doc(value))
                for key, value in doc.items()
            }
        elif isinstance(doc, list):
            return [self._serialize_mongodb_doc(item) for item in doc]
        elif isinstance(doc, ObjectId):
            return str(doc)
        elif isinstance(doc, datetime):
            return doc.isoformat()
        return doc

    def save_report(self, report_data: List[Dict], task_id: str) -> str:
        """
        Save a complete report to MongoDB.

        Args:
            report_data: List of report data (as loaded from JSON)
            task_id: Unique task identifier

        Returns:
            str: Document ID of the saved report
        """
        try:
            # Prepare document
            document = {
                "task_id": task_id,
                "saved_at": datetime.utcnow(),
                "report_count": len(report_data),
                "reports": report_data
            }

            # Extract and save individual agent data
            agents_saved = 0
            for report in report_data:
                if "all_agents" in report:
                    agents_saved += self._save_agents_from_report(report, task_id)

            # Save the complete report
            result = self.reports_collection.insert_one(document)

            logger.info(f"Saved report {task_id} with {len(report_data)} records and {agents_saved} agents")
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error saving report: {e}")
            raise

    def _save_agents_from_report(self, report: Dict, task_id: str) -> int:
        """
        Extract and save individual agent records from a report.

        Args:
            report: Single report dictionary
            task_id: Task identifier

        Returns:
            int: Number of agents processed
        """
        agents_processed = 0

        try:
            for agent in report.get("all_agents", []):
                agent_doc = {
                    "agent_name": agent.get("agent_name"),
                    "agent_number": agent.get("agent_number"),
                    "task_id": task_id,
                    "report_timestamp": report.get("timestamp"),
                    "last_updated": datetime.utcnow(),
                    "incoming_calls": agent.get("incoming_calls", {}),
                    "outgoing_calls": agent.get("outgoing_calls", {}),
                    "actions": agent.get("actions", ""),
                    "row_index": agent.get("row_index")
                }

                # Update or insert agent data
                self.agents_collection.update_one(
                    {
                        "agent_name": agent.get("agent_name"),
                        "task_id": task_id
                    },
                    {"$set": agent_doc},
                    upsert=True
                )
                agents_processed += 1

        except Exception as e:
            logger.error(f"Error saving agents from report: {e}")

        return agents_processed

    def get_reports_by_task_id(self, task_id: str) -> Optional[Dict]:
        """Get reports by task ID."""
        try:
            report = self.reports_collection.find_one({"task_id": task_id})
            return self._serialize_mongodb_doc(report) if report else None
        except Exception as e:
            logger.error(f"Error getting reports by task ID: {e}")
            return None

    def get_agent_data(self, agent_name: str, limit: int = 100) -> List[Dict]:
        """
        Get agent data by name.

        Args:
            agent_name: Name of the agent
            limit: Maximum number of records to return

        Returns:
            List of agent records
        """
        try:
            cursor = self.agents_collection.find(
                {"agent_name": {"$regex": agent_name, "$options": "i"}},
                sort=[("last_updated", DESCENDING)],
                limit=limit
            )
            return [self._serialize_mongodb_doc(doc) for doc in cursor]
        except Exception as e:
            logger.error(f"Error getting agent data: {e}")
            return []

    def get_all_agent_names(self) -> List[str]:
        """Get all unique agent names."""
        try:
            return self.agents_collection.distinct("agent_name")
        except Exception as e:
            logger.error(f"Error getting agent names: {e}")
            return []

    def get_recent_reports(self, limit: int = 10) -> List[Dict]:
        """Get recent reports."""
        try:
            cursor = self.reports_collection.find(
                {},
                {"task_id": 1, "saved_at": 1, "report_count": 1},
                sort=[("saved_at", DESCENDING)],
                limit=limit
            )
            return [self._serialize_mongodb_doc(doc) for doc in cursor]
        except Exception as e:
            logger.error(f"Error getting recent reports: {e}")
            return []

    def search_agents_by_performance(self, min_calls: int = 0) -> List[Dict]:
        """
        Search agents by performance criteria.

        Args:
            min_calls: Minimum number of total incoming calls

        Returns:
            List of agent records matching criteria
        """
        try:
            pipeline = [
                {
                    "$addFields": {
                        "total_calls": {
                            "$toInt": "$incoming_calls.total"
                        }
                    }
                },
                {
                    "$match": {
                        "total_calls": {"$gte": min_calls}
                    }
                },
                {
                    "$sort": {"total_calls": -1}
                }
            ]

            results = list(self.agents_collection.aggregate(pipeline))
            return [self._serialize_mongodb_doc(doc) for doc in results]
        except Exception as e:
            logger.error(f"Error searching agents by performance: {e}")
            return []

    def get_agent_statistics(self) -> Dict[str, Any]:
        """Get overall agent statistics."""
        try:
            stats = {
                "total_agents": self.agents_collection.count_documents({}),
                "total_reports": self.reports_collection.count_documents({}),
                "unique_agent_names": len(self.get_all_agent_names())
            }

            # Get latest report timestamp
            latest_report = self.reports_collection.find_one(
                {},
                sort=[("saved_at", DESCENDING)]
            )

            if latest_report:
                stats["latest_report"] = latest_report["saved_at"].isoformat()

            return stats
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}

    def close_connection(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Global instance
mongodb_service = None

def get_mongodb_service() -> MongoDBService:
    """Get or create MongoDB service instance."""
    global mongodb_service
    if mongodb_service is None:
        mongodb_service = MongoDBService()
    return mongodb_service 