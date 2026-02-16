// Simple standalone test to verify IST timezone handling logic

const IST_TIMEZONE = 'Asia/Kolkata';

function getISTDateString(date = new Date()) {
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function startOfTodayIST() {
    const todayStr = getISTDateString();
    // Parse the date string as IST timezone to get midnight IST
    const startOfDay = new Date(`${todayStr}T00:00:00.000+05:30`);
    return startOfDay;
}

function endOfTodayIST() {
    const todayStr = getISTDateString();
    // Parse the date string as IST timezone to get end of day IST
    const endOfDay = new Date(`${todayStr}T23:59:59.999+05:30`);
    return endOfDay;
}

console.log('=== Testing IST Timezone Handling Logic ===\n');

// Current time
const now = new Date();
console.log('1. Current server time:', now.toISOString());
console.log('   Server timezone offset (mins):', now.getTimezoneOffset());

// IST date string
const dateStr = getISTDateString();
console.log('\n2. IST date string:', dateStr);
console.log('   Expected: 2026-02-16');

// Start of today IST
const startOfToday = startOfTodayIST();
console.log('\n3. Start of today IST:');
console.log('   ISO:', startOfToday.toISOString());
console.log('   Expected: 2026-02-15T18:30:00.000Z (which is 2026-02-16 00:00:00 IST)');

// End of today IST
const endOfToday = endOfTodayIST();
console.log('\n4. End of today IST:');
console.log('   ISO:', endOfToday.toISOString());
console.log('   Expected: 2026-02-16T18:29:59.999Z (which is 2026-02-16 23:59:59.999 IST)');

// Duration
const duration = endOfToday.getTime() - startOfToday.getTime();
const hours = duration / (1000 * 60 * 60);
console.log('\n5. Date range:');
console.log('   Duration (hours):', hours.toFixed(4));
console.log('   Expected: ~24 hours');
console.log('   Valid?', Math.abs(hours - 24) < 0.01 ? '✓ YES' : '✗ NO');

// Check if same day in IST
const startDateStr = getISTDateString(startOfToday);
const endDateStr = getISTDateString(endOfToday);
console.log('\n6. Same day check (IST):');
console.log('   Start:', startDateStr);
console.log('   End:', endDateStr);
console.log('   Same day?', startDateStr === endDateStr ? '✓ YES' : '✗ NO');

console.log('\n=== Test Complete ===');
