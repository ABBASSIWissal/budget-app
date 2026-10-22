// Noms des mois en français
const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Structure globale des données de l'application
let appState = {
    months: {},             // Ex: { "2026-0": { budget: 3000, expenses: [], isFinished: false } }
    piggy: {
        total: 0,
        goal: 0
    },
    settings: {
        pinCode: '',
        theme: 'beige',
        startMonth: 0,
        startYear: 2026,
        defaultBudget: 0
    },
    currentView: {
        year: 2026,
        month: 0
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
    loadAppState();
    initApp();
});

// Charger les données sauvegardées dans le navigateur
function loadAppState() {
    const savedState = localStorage.getItem('my_budget_app_data');
    if (savedState) {
        try {
            appState = JSON.parse(savedState);
        } catch (e) {
            console.error('Erreur de lecture des données sauvegardées', e);
        }
    }
}

// Sauvegarder les données
function saveAppState() {
    localStorage.setItem('my_budget_app_data', JSON.stringify(appState));
}

// Initialiser l'état initial
function initApp() {
    applyTheme(appState.settings.theme || 'beige');

    // Vérifier si la configuration initiale a déjà été faite
    if (!appState.settings.pinCode) {
        showScreen('setup-screen');
    } else {
        showScreen('login-screen');
    }
}

// Affichage des écrans principaux (Setup / Login / App)
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'flex';
    }
}

// Configuration initiale lors du premier lancement
function setupBudget() {
    const month = parseInt(document.getElementById('start-month').value, 10);
    const year = parseInt(document.getElementById('start-year').value, 10);
    const budget = parseFloat(document.getElementById('initial-budget').value);
    const code = document.getElementById('access-code').value;
    const confirmCode = document.getElementById('confirm-code').value;

    if (isNaN(budget) || budget <= 0) {
        alert('Veuillez entrer un budget valide.');
        return;
    }

    if (!code || code.length !== 4 || isNaN(code)) {
        alert('Le code doit comporter 4 chiffres.');
        return;
    }

    if (code !== confirmCode) {
        alert('Les deux codes entrés ne correspondent pas.');
        return;
    }

    appState.settings.startMonth = month;
    appState.settings.startYear = year;
    appState.settings.defaultBudget = budget;
    appState.settings.pinCode = code;

    appState.currentView.year = year;
    appState.currentView.month = month;

    // Initialiser le premier mois
    getMonthData(year, month);

    saveAppState();
    showScreen('app-screen');
    showSection('dashboard');
    updateDashboard();
}

// Connexion
function login() {
    const inputCode = document.getElementById('login-code').value;
    const errorEl = document.getElementById('login-error');

    if (inputCode === appState.settings.pinCode) {
        errorEl.textContent = '';
        document.getElementById('login-code').value = '';
        showScreen('app-screen');
        showSection('dashboard');
        updateDashboard();
    } else {
        errorEl.textContent = 'Code PIN incorrect.';
    }
}

// Déconnexion
function logout() {
    showScreen('login-screen');
}

// Basculer entre les sections (Tableau de bord, Thèmes, Paramètres, etc.)
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }

    if (sectionId === 'piggy-savings') {
        updatePiggyUI();
    } else if (sectionId === 'monthly-balance') {
        renderMonthsHistory();
    } else if (sectionId === 'dashboard') {
        updateDashboard();
    }
}

// Obtenir ou initialiser les données d'un mois
function getMonthData(year, month) {
    const key = `${year}-${month}`;
    if (!appState.months[key]) {
        appState.months[key] = {
            budget: appState.settings.defaultBudget || 0,
            expenses: [],
            isFinished: false
        };
    }
    return appState.months[key];
}

// Navigation entre les mois
function previousMonth() {
    let { year, month } = appState.currentView;
    month--;
    if (month < 0) {
        month = 11;
        year--;
    }
    appState.currentView.year = year;
    appState.currentView.month = month;
    updateDashboard();
}

function nextMonth() {
    let { year, month } = appState.currentView;
    month++;
    if (month > 11) {
        month = 0;
        year++;
    }
    appState.currentView.year = year;
    appState.currentView.month = month;
    updateDashboard();
}

// Mettre à jour l'affichage général du Tableau de Bord
function updateDashboard() {
    const { year, month } = appState.currentView;
    const monthData = getMonthData(year, month);

    document.getElementById('current-month-display').textContent = `${MONTH_NAMES[month]} ${year}`;

    // Calcul des totaux
    const totalBudget = monthData.budget;
    const totalSpent = monthData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const remaining = totalBudget - totalSpent;

    document.getElementById('total-budget').textContent = `${totalBudget} DH`;
    document.getElementById('total-spent').textContent = `${totalSpent} DH`;
    document.getElementById('remaining-budget').textContent = `${remaining} DH`;
    document.getElementById('total-saved').textContent = `${appState.piggy.total} DH`;

    // Statut du mois
    const statusMsg = document.getElementById('month-status-message');
    if (monthData.isFinished) {
        statusMsg.textContent = '🔒 Ce mois est clôturé et enregistré.';
    } else {
        statusMsg.textContent = '';
    }

    renderExpensesList(monthData.expenses);
}

// Générer la liste des dépenses pour le mois affiché
function renderExpensesList(expenses) {
    const container = document.getElementById('expenses-list');
    container.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<div class="empty-expenses">Aucune dépense enregistrée pour ce mois.</div>';
        return;
    }

    // Afficher de la plus récente à la plus ancienne
    expenses.slice().reverse().forEach((expense, index) => {
        const realIndex = expenses.length - 1 - index;
        const item = document.createElement('div');
        item.className = 'expense-item';

        item.innerHTML = `
            <div class="expense-info">
                <span class="expense-desc">${expense.description || 'Dépense'}</span>
                <span class="expense-date">${expense.date || ''}</span>
            </div>
            <div class="expense-action">
                <span class="expense-amount">-${expense.amount} DH</span>
                <button type="button" class="delete-expense-btn" onclick="deleteExpense(${realIndex})">✕</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Ouvrir la boîte de dialogue d'ajout de dépense
function addExpense() {
    const { year, month } = appState.currentView;
    const monthData = getMonthData(year, month);

    if (monthData.isFinished) {
        alert('Ce mois est clôturé. Impossible d\'y ajouter une dépense.');
        return;
    }

    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-description').value = '';
    document.getElementById('expense-modal').style.display = 'flex';
}

function closeExpenseModal() {
    document.getElementById('expense-modal').style.display = 'none';
}

// Enregistrer la dépense
function saveExpense() {
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const description = document.getElementById('expense-description').value.trim();

    if (isNaN(amount) || amount <= 0) {
        alert('Veuillez entrer un montant valide.');
        return;
    }

    const { year, month } = appState.currentView;
    const monthData = getMonthData(year, month);

    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    monthData.expenses.push({
        amount: amount,
        description: description || 'Dépense',
        date: dateStr
    });

    saveAppState();
    closeExpenseModal();
    updateDashboard();
}

// Supprimer une dépense
function deleteExpense(index) {
    const { year, month } = appState.currentView;
    const monthData = getMonthData(year, month);

    if (monthData.isFinished) {
        alert('Ce mois est clôturé. Vous ne pouvez plus modifier les dépenses.');
        return;
    }

    if (confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
        monthData.expenses.splice(index, 1);
        saveAppState();
        updateDashboard();
    }
}

// Clôturer le mois actuel
function finishCurrentMonth() {
    const { year, month } = appState.currentView;
    const monthData = getMonthData(year, month);

    if (monthData.isFinished) {
        alert('Ce mois est déjà clôturé.');
        return;
    }

    if (confirm(`Voulez-vous clôturer le mois de ${MONTH_NAMES[month]} ${year} ?`)) {
        monthData.isFinished = true;

        const totalSpent = monthData.expenses.reduce((sum, item) => sum + item.amount, 0);
        const remaining = monthData.budget - totalSpent;
        if (remaining > 0) {
            appState.piggy.total += remaining;
        }

        saveAppState();
        updateDashboard();
        alert('Mois clôturé avec succès !');
    }
}

// Gestion de la tirelire / cochonnette
function updatePiggyUI() {
    const total = appState.piggy.total || 0;
    const goal = appState.piggy.goal || 0;

    document.getElementById('piggy-page-total').textContent = `${total} DH`;
    document.getElementById('piggy-goal').value = goal || '';

    const goalText = document.getElementById('piggy-goal-text');
    const progressText = document.getElementById('piggy-progress-text');
    const progressFill = document.getElementById('piggy-progress-fill');

    if (goal > 0) {
        goalText.textContent = `Objectif : ${goal} DH`;
        const percentage = Math.min(100, Math.round((total / goal) * 100));
        progressText.textContent = `${percentage} %`;
        progressFill.style.width = `${percentage}%`;
    } else {
        goalText.textContent = 'Objectif : aucun';
        progressText.textContent = '0 %';
        progressFill.style.width = '0%';
    }
}

function savePiggyGoal() {
    const goal = parseFloat(document.getElementById('piggy-goal').value);
    appState.piggy.goal = isNaN(goal) ? 0 : goal;
    saveAppState();
    updatePiggyUI();
    alert('Objectif sauvegardé !');
}

function addSavings() {
    const value = prompt('Montant à ajouter à la cochonnette (DH) :');
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount > 0) {
        appState.piggy.total += amount;
        saveAppState();
        updatePiggyUI();
    }
}

function removeSavings() {
    const value = prompt('Montant à retirer de la cochonnette (DH) :');
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount > 0) {
        if (amount > appState.piggy.total) {
            alert('Le montant demandé dépasse le solde disponible.');
            return;
        }
        appState.piggy.total -= amount;
        saveAppState();
        updatePiggyUI();
    }
}

// Historique des mois
function renderMonthsHistory() {
    const container = document.getElementById('months-history');
    container.innerHTML = '';

    const sortedKeys = Object.keys(appState.months).sort((a, b) => {
        const [yA, mA] = a.split('-').map(Number);
        const [yB, mB] = b.split('-').map(Number);
        return yB !== yA ? yB - yA : mB - mA;
    });

    if (sortedKeys.length === 0) {
        container.innerHTML = '<p class="center-text">Aucun historique disponible.</p>';
        return;
    }

    sortedKeys.forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const monthData = appState.months[key];
        const totalSpent = monthData.expenses.reduce((sum, item) => sum + item.amount, 0);
        const remaining = monthData.budget - totalSpent;

        const item = document.createElement('div');
        item.className = 'history-item';

        item.innerHTML = `
            <button type="button" class="history-month-title" onclick="toggleHistoryItem(this)">
                <span><strong>${MONTH_NAMES[month]} ${year}</strong></span>
                <div class="history-month-actions">
                    <span class="month-completed-label">${monthData.isFinished ? '✅ Clôturé' : '⏳ En cours'}</span>
                    <span class="history-month-arrow">▶</span>
                </div>
            </button>

            <div class="history-month-content">
                <div class="history-stats">
                    <div class="history-stat">Budget : <strong>${monthData.budget} DH</strong></div>
                    <div class="history-stat">Dépensé : <strong>${totalSpent} DH</strong></div>
                    <div class="history-stat">Reste : <strong>${remaining} DH</strong></div>
                </div>

                <h3>Dépenses :</h3>
                ${
                    monthData.expenses.length > 0
                        ? monthData.expenses.map(exp => `
                            <div class="balance-item">
                                <strong>\${exp.description}</strong> : -${exp.amount} DH (${exp.date})
                            </div>
                        `).join('')
                        : '<p>Aucune dépense pour ce mois.</p>'
                }

                <button type="button" class="danger" style="margin-top: 15px;" onclick="deleteMonthHistory('${key}')">
                    🗑️ Supprimer ce mois
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleHistoryItem(btn) {
    const parent = btn.parentElement;
    parent.classList.toggle('open');
}

function deleteMonthHistory(key) {
    if (confirm('Voulez-vous supprimer ce mois de votre historique ?')) {
        delete appState.months[key];
        saveAppState();
        renderMonthsHistory();
    }
}

// Appliquer un thème
function setTheme(themeName) {
    appState.settings.theme = themeName;
    applyTheme(themeName);
    saveAppState();
}

function applyTheme(themeName) {
    document.body.className = '';
    document.body.classList.add(`theme-${themeName}`);
}

// Paramètres
function changeBudget() {
    const current = appState.settings.defaultBudget;
    const value = prompt('Entrez le nouveau budget mensuel par défaut (DH) :', current);
    const newBudget = parseFloat(value);

    if (!isNaN(newBudget) && newBudget > 0) {
        appState.settings.defaultBudget = newBudget;

        const { year, month } = appState.currentView;
        const monthData = getMonthData(year, month);
        if (!monthData.isFinished) {
            monthData.budget = newBudget;
        }

        saveAppState();
        updateDashboard();
        alert('Budget mis à jour !');
    }
}

function changeCode() {
    const code = prompt('Nouveau code PIN (4 chiffres) :');
    if (code && code.length === 4 && !isNaN(code)) {
        appState.settings.pinCode = code;
        saveAppState();
        alert('Code PIN mis à jour avec succès.');
    } else if (code !== null) {
        alert('Le code PIN doit comporter exactement 4 chiffres.');
    }
}

function resetApplication() {
    if (confirm('⚠️ Voulez-vous réinitialiser l\'application ? Toutes les données seront perdues.')) {
        localStorage.removeItem('my_budget_app_data');
        location.reload();
    }
}

function closeBalanceModal() {
    document.getElementById('balance-modal').style.display = 'none';
}
