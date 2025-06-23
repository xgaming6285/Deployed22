// Constants for bonus rates
export const BONUS_RATES = {
    firstCall: 10.00,
    secondCall: 7.50,
    thirdCall: 7.50,
    fourthCall: 5.00,
    fifthCall: 10.00,
    verifiedAcc: 5.00
};

export const RATE_PER_SECOND = 0.0027800;

/**
 * Calculates bonuses based on call counts
 * @param {number} firstCalls - Number of first calls
 * @param {number} secondCalls - Number of second calls
 * @param {number} thirdCalls - Number of third calls
 * @param {number} fourthCalls - Number of fourth calls
 * @param {number} fifthCalls - Number of fifth calls
 * @param {number} verifiedAccounts - Number of verified accounts
 * @returns {Object} Object containing all bonus calculations
 */
export const calculateBonuses = (
    firstCalls,
    secondCalls,
    thirdCalls,
    fourthCalls,
    fifthCalls,
    verifiedAccounts
) => {
    return {
        firstCallBonus: firstCalls * BONUS_RATES.firstCall,
        secondCallBonus: secondCalls * BONUS_RATES.secondCall,
        thirdCallBonus: thirdCalls * BONUS_RATES.thirdCall,
        fourthCallBonus: fourthCalls * BONUS_RATES.fourthCall,
        fifthCallBonus: fifthCalls * BONUS_RATES.fifthCall,
        verifiedAccBonus: verifiedAccounts * BONUS_RATES.verifiedAcc
    };
};

/**
 * Calculates total payment including talk pay, bonuses and deductions
 * @param {number} talkPay - Base pay for talk time
 * @param {Object} bonuses - Object containing all bonus amounts
 * @param {number} fines - Total fines/deductions
 * @returns {number} Total payable amount
 */
export const calculateTotalPayment = (talkPay, bonuses, fines) => {
    const totalBonuses = Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0);
    return talkPay + totalBonuses - fines;
};

/**
 * Converts HH:MM:SS time format to total seconds
 * @param {string} time - Time in HH:MM:SS format
 * @returns {number} Total seconds
 */
export const timeToSeconds = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
};

/**
 * Converts seconds to HH:MM:SS format
 * @param {number} totalSeconds - Total number of seconds
 * @returns {string} Time in HH:MM:SS format
 */
export const secondsToTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
}; 