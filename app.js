// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log(err));
  });
}

// DOM Elements
const billForm = document.getElementById('bill-form');
const serviceNameInput = document.getElementById('service-name');
const billCategoryInput = document.getElementById('bill-category');
const billAmountInput = document.getElementById('bill-amount');
const billDateInput = document.getElementById('bill-date');
const billList = document.getElementById('bill-list');
const totalTrackedEl = document.getElementById('total-tracked');
const totalSavedEl = document.getElementById('total-saved');
const emptyStateEl = document.getElementById('empty-state');

// State Management
let bills = JSON.parse(localStorage.getItem('billguard_bills')) || [];
let totalSavedCash = parseFloat(localStorage.getItem('billguard_saved_cash')) || 0.00;

// Updates the stats counters at the top
function updateStats() {
  const activeTotal = bills.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  totalTrackedEl.textContent = `$${activeTotal.toFixed(2)}`;
  totalSavedEl.textContent = `$${totalSavedCash.toFixed(2)}`;
}

// Generates real-time countdown math
function getCountdown(dateString) {
  const targetDate = new Date(dateString + 'T00:00:00');
  const now = new Date();
  
  const diffTime = targetDate - now;
  
  if (diffTime <= 0) {
    return { text: "Action Needed", urgent: true };
  }

  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days === 0) {
    return { text: `${hours}h left`, urgent: true };
  }
  return { text: `${days}d ${hours}h left`, urgent: days <= 2 };
}

// Intercepts removal to track financial savings
window.removeGuard = function(id, amount, category) {
  if (category === 'Expiry') {
    const savedMoney = confirm("Did you cancel this trial in time to avoid getting charged?");
    if (savedMoney) {
      totalSavedCash += parseFloat(amount);
      localStorage.setItem('billguard_saved_cash', totalSavedCash);
    }
  }
  
  bills = bills.filter(bill => bill.id !== id);
  localStorage.setItem('billguard_bills', JSON.stringify(bills));
  renderBills();
};

// Main dynamic renderer
function renderBills() {
  billList.innerHTML = '';
  
  if (bills.length === 0) {
    billList.appendChild(emptyStateEl);
    updateStats();
    return;
  }

  bills.sort((a, b) => new Date(a.date) - new Date(b.date));

  bills.forEach(bill => {
    const countdown = getCountdown(bill.date);
    const categoryBadgeColor = bill.category === 'Bill' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    const countdownBadgeColor = countdown.urgent ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-gray-800 text-gray-400 border-gray-700';

    const card = document.createElement('div');
    card.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center';
    card.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-gray-100 text-sm">${bill.name}</h3>
          <span class="text-[10px] border px-1.5 py-0.5 rounded-md font-medium ${categoryBadgeColor}">${bill.category}</span>
        </div>
        <div class="text-xs ${countdownBadgeColor} border px-2 py-0.5 rounded-lg inline-block font-semibold">
          ⏱️ ${countdown.text}
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-emerald-400 text-base">$${parseFloat(bill.amount).toFixed(2)}</span>
        <button onclick="removeGuard('${bill.id}', '${bill.amount}', '${bill.category}')" class="text-gray-500 hover:text-rose-400 transition text-sm cursor-pointer p-1">✕</button>
      </div>
    `;
    billList.appendChild(card);
  });

  updateStats();
}

// Form Submission Engine
billForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newBill = {
    id: Date.now().toString(),
    name: serviceNameInput.value,
    category: billCategoryInput.value,
    amount: billAmountInput.value,
    date: billDateInput.value
  };

  bills.push(newBill);
  localStorage.setItem('billguard_bills', JSON.stringify(bills));
  
  renderBills();
  billForm.reset();
});

// Real-time ticking updates (refreshes timers every 60 seconds)
setInterval(renderBills, 60000);

// Initial bootstrap run
renderBills();
