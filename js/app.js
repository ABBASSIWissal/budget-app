const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril',
    'Mai', 'Juin', 'Juillet', 'Août',
    'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const THEME_NAMES = [
    'beige',
    'rose',
    'rouge',
    'orange',
    'jaune',
    'vert',
    'menthe',
    'bleu',
    'ciel',
    'violet',
    'mauve',
    'sombre',
    'chocolat',
    'lavande',
    'minimal',
    'ocean-nuit',
    'nude',
    'terracotta',
    'pistache',
    'denim',
    'prune',
    'caramel',
    'eucalyptus',
    'ardoise'
];

let monthlyBudget = 0;
let accessCode = '';
let currentMonth = 0;
let currentYear = 2026;
let expenses = {};
let totalSavings = 0;
let piggyGoal = 0;
let lastSavedMonth = '';
let audioContext = null;

document.addEventListener('DOMContentLoaded', function () {
    loadData();
    loadTheme();
    showCorrectScreen();
    updateMonthDisplay();

    setTimeout(function () {
        checkMonthFinishedAutomatically();
    }, 500);

    setInterval(function () {
        checkMonthFinishedAutomatically();
    }, 60 * 60 * 1000);
});


/* =========================================================
   OUTILS
========================================================= */

function formatMoney(value) {
    return Number(value || 0).toFixed(0) + ' DH';
}

function getMonthKey(
    year = currentYear,
    month = currentMonth
) {
    return year + '-' + month;
}

function getMonthName(month) {
    return MONTHS[Number(month)] || 'Mois inconnu';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getNextMonthValues() {
    let month = currentMonth + 1;
    let year = currentYear;

    if (month > 11) {
        month = 0;
        year++;
    }

    return {
        month: month,
        year: year
    };
}

function getPreviousMonthValues() {
    let month = currentMonth - 1;
    let year = currentYear;

    if (month < 0) {
        month = 11;
        year--;
    }

    return {
        month: month,
        year: year
    };
}


/* =========================================================
   CONFIGURATION
========================================================= */

function setupBudget() {
    const month = Number(
        document.getElementById('start-month').value
    );

    const year = Number(
        document.getElementById('start-year').value
    );

    const budget = Number(
        document.getElementById('initial-budget').value
    );

    const code = String(
        document.getElementById('access-code').value || ''
    ).trim();

    const confirmCode = String(
        document.getElementById('confirm-code').value || ''
    ).trim();

    if (
        !Number.isInteger(month) ||
        month < 0 ||
        month > 11
    ) {
        alert('Entre un mois valide.');
        return;
    }

    if (
        !Number.isFinite(year) ||
        year < 2000
    ) {
        alert('Entre une année valide.');
        return;
    }

    if (
        !Number.isFinite(budget) ||
        budget <= 0
    ) {
        alert('Entre un budget valide.');
        return;
    }

    if (!/^\d{4}$/.test(code)) {
        alert(
            'Le code doit contenir exactement 4 chiffres.'
        );
        return;
    }

    if (code !== confirmCode) {
        alert('Les deux codes ne sont pas identiques.');
        return;
    }

    monthlyBudget = budget;
    accessCode = code;
    currentMonth = month;
    currentYear = year;
    lastSavedMonth = '';

    ensureMonthExists();
    saveData();

    document.getElementById('setup-screen').style.display =
        'none';

    document.getElementById('login-screen').style.display =
        'flex';

    document.getElementById('app-screen').style.display =
        'none';

    alert(
        'Configuration enregistrée. Entre maintenant ton code.'
    );
}

function login() {
    if (!accessCode) {
        loadData();
    }

    const code = String(
        document.getElementById('login-code').value || ''
    ).trim();

    if (code === String(accessCode).trim()) {
        document.getElementById('setup-screen').style.display =
            'none';

        document.getElementById('login-screen').style.display =
            'none';

        document.getElementById('app-screen').style.display =
            'block';

        updateMonthDisplay();
        updateDashboard();
        checkMonthFinishedAutomatically();

        document.getElementById('login-error').textContent =
            '';
    } else {
        document.getElementById('login-error').textContent =
            'Code incorrect.';
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(function (
        section
    ) {
        section.classList.remove('active');
    });

    const section =
        document.getElementById(sectionId);

    if (!section) {
        return;
    }

    section.classList.add('active');

    if (sectionId === 'monthly-balance') {
        updateMonthlyBalance();
    }

    if (sectionId === 'piggy-savings') {
        updatePiggyDisplay();
        updatePiggyProgress();

        const goalInput =
            document.getElementById('piggy-goal');

        if (goalInput) {
            goalInput.value =
                piggyGoal > 0
                    ? piggyGoal
                    : '';
        }
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


/* =========================================================
   GESTION DES MOIS
========================================================= */

function updateMonthDisplay() {
    const display =
        document.getElementById(
            'current-month-display'
        );

    if (display) {
        display.textContent =
            getMonthName(currentMonth) +
            ' ' +
            currentYear;
    }
}

function ensureMonthExists(
    year = currentYear,
    month = currentMonth
) {
    const monthKey =
        getMonthKey(year, month);

    if (!expenses[monthKey]) {
        expenses[monthKey] = {
            details: [],
            completed: false,
            completedAt: null
        };
    }

    if (
        !Array.isArray(
            expenses[monthKey].details
        )
    ) {
        expenses[monthKey].details = [];
    }

    if (
        typeof expenses[monthKey].completed !==
        'boolean'
    ) {
        expenses[monthKey].completed = false;
    }

    if (
        !Object.prototype.hasOwnProperty.call(
            expenses[monthKey],
            'completedAt'
        )
    ) {
        expenses[monthKey].completedAt = null;
    }

    return expenses[monthKey];
}

function previousMonth() {
    const previous =
        getPreviousMonthValues();

    currentMonth = previous.month;
    currentYear = previous.year;

    ensureMonthExists();
    updateMonthDisplay();
    updateDashboard();
}

function nextMonth() {
    const next =
        getNextMonthValues();

    currentMonth = next.month;
    currentYear = next.year;

    ensureMonthExists();
    updateMonthDisplay();
    updateDashboard();
}

function finishCurrentMonth(
    automatic = false
) {
    const currentKey =
        getMonthKey();

    const monthData =
        ensureMonthExists();

    if (monthData.completed) {
        if (!automatic) {
            alert(
                'Ce mois est déjà enregistré.'
            );
        }

        return;
    }

    monthData.completed = true;
    monthData.completedAt =
        new Date().toISOString();

    const totalSpent =
        monthData.details.reduce(function (
            total,
            item
        ) {
            return total + Number(item.amount || 0);
        }, 0);

    const remaining =
        monthlyBudget - totalSpent;

    if (remaining > 0) {
        totalSavings += remaining;
    }

    lastSavedMonth = currentKey;

    const next =
        getNextMonthValues();

    currentMonth = next.month;
    currentYear = next.year;

    ensureMonthExists();

    saveData();
    updateMonthDisplay();
    updateDashboard();

    const message =
        document.getElementById(
            'month-status-message'
        );

    if (message) {
        message.textContent =
            '✅ Mois enregistré. Nouveau mois affiché : ' +
            getMonthName(next.month) +
            ' ' +
            next.year;

        setTimeout(function () {
            message.textContent = '';
        }, 6000);
    }

    if (!automatic) {
        alert(
            'Le mois a été enregistré.\n\n' +
            'Le mois suivant affiché est : ' +
            getMonthName(next.month) +
            ' ' +
            next.year
        );
    }
}

function checkMonthFinishedAutomatically() {
    if (
        monthlyBudget <= 0 ||
        !accessCode
    ) {
        return;
    }

    const today = new Date();

    const lastDay =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        ).getDate();

    const isLastDay =
        today.getDate() === lastDay;

    const currentIsToday =
        currentYear === today.getFullYear() &&
        currentMonth === today.getMonth();

    const todayKey =
        getMonthKey(
            today.getFullYear(),
            today.getMonth()
        );

    const todayData =
        expenses[todayKey];

    const alreadyCompleted =
        todayData &&
        todayData.completed === true;

    if (
        isLastDay &&
        currentIsToday &&
        !alreadyCompleted
    ) {
        finishCurrentMonth(true);
    }
}


/* =========================================================
   TABLEAU DE BORD (DÉPENSES DU MOIS SEULEMENT)
========================================================= */

function updateDashboard() {
    const monthData =
        ensureMonthExists();

    const totalSpent =
        monthData.details.reduce(function (
            total,
            item
        ) {
            return total + Number(item.amount || 0);
        }, 0);

    const remaining =
        monthlyBudget - totalSpent;

    const budgetElement =
        document.getElementById(
            'total-budget'
        );

    const spentElement =
        document.getElementById(
            'total-spent'
        );

    const remainingElement =
        document.getElementById(
            'remaining-budget'
        );

    const savedElement =
        document.getElementById(
            'total-saved'
        );

    if (budgetElement) {
        budgetElement.textContent =
            formatMoney(monthlyBudget);
    }

    if (spentElement) {
        spentElement.textContent =
            formatMoney(totalSpent);
    }

    if (remainingElement) {
        remainingElement.textContent =
            formatMoney(remaining);
    }

    if (savedElement) {
        savedElement.textContent =
            formatMoney(totalSavings);
    }

    const message =
        document.getElementById(
            'month-status-message'
        );

    if (message) {
        if (monthData.completed) {
            message.textContent =
                '🔒 Ce mois est clôturé et enregistré.';
        } else {
            message.textContent = '';
        }
    }

    renderMonthExpensesList(monthData.details);
    updatePiggyDisplay();
    updatePiggyProgress();
    saveData();
}

function renderMonthExpensesList(details) {
    const container =
        document.getElementById('expenses-list');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!details || details.length === 0) {
        container.innerHTML =
            '<div class="empty-expenses">Aucune dépense enregistrée pour ce mois.</div>';
        return;
    }

    details.slice().reverse().forEach(function (item, index) {
        const realIndex =
            details.length - 1 - index;

        const div =
            document.createElement('div');

        div.className = 'expense-item';

        div.innerHTML = `
            <div class="expense-info">
                <span class="expense-desc">
                    ${escapeHtml(item.description)}
                </span>
                <span class="expense-date">
                    ${escapeHtml(item.date)}
                </span>
            </div>
            <div class="expense-action">
                <span class="expense-amount">
                    -${formatMoney(item.amount)}
                </span>
                <button
                    type="button"
                    class="delete-expense-btn"
                    onclick="deleteExpense(${realIndex})"
                >
                    ✕
                </button>
            </div>
        `;

        container.appendChild(div);
    });
}


/* =========================================================
   DÉPENSES
========================================================= */

function addExpense() {
    const monthData =
        ensureMonthExists();

    if (monthData.completed) {
        alert(
            'Ce mois est terminé. Tu ne peux plus ajouter de dépense.'
        );
        return;
    }

    const modal =
        document.getElementById(
            'expense-modal'
        );

    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeExpenseModal() {
    const modal =
        document.getElementById(
            'expense-modal'
        );

    if (modal) {
        modal.style.display = 'none';
    }

    const amountInput =
        document.getElementById(
            'expense-amount'
        );

    const descriptionInput =
        document.getElementById(
            'expense-description'
        );

    if (amountInput) {
        amountInput.value = '';
    }

    if (descriptionInput) {
        descriptionInput.value = '';
    }
}

function closeModal() {
    closeExpenseModal();
}

function saveExpense() {
    const amount =
        Number(
            document.getElementById(
                'expense-amount'
            ).value
        );

    const description =
        document.getElementById(
            'expense-description'
        ).value.trim();

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert('Entre un montant valide.');
        return;
    }

    const monthData =
        ensureMonthExists();

    if (monthData.completed) {
        alert(
            'Ce mois est terminé. Tu ne peux plus ajouter de dépense.'
        );
        return;
    }

    monthData.details.push({
        amount: amount,
        description: description || 'Dépense',
        date: new Date().toLocaleDateString(
            'fr-FR'
        )
    });

    saveData();
    closeExpenseModal();
    updateDashboard();

    alert('Dépense ajoutée avec succès.');
}

function deleteExpense(index) {
    const monthData =
        ensureMonthExists();

    if (monthData.completed) {
        alert(
            'Ce mois est clôturé. Tu ne peux plus modifier ses dépenses.'
        );
        return;
    }

    if (confirm('Veux-tu vraiment supprimer cette dépense ?')) {
        monthData.details.splice(index, 1);
        saveData();
        updateDashboard();
    }
}

function closeBalanceModal() {
    const modal =
        document.getElementById(
            'balance-modal'
        );

    if (modal) {
        modal.style.display = 'none';
    }
}


/* =========================================================
   SON DE LA COCHONNETTE
========================================================= */

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        audioContext =
            new AudioContextClass();
    }

    return audioContext;
}

function playPiggySound(type) {
    const context =
        getAudioContext();

    if (!context) {
        return;
    }

    const continueSound =
        function () {
            const oscillator =
                context.createOscillator();

            const gain =
                context.createGain();

            const now =
                context.currentTime;

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.type = 'sine';

            if (type === 'add') {
                oscillator.frequency.setValueAtTime(
                    520,
                    now
                );

                oscillator.frequency.exponentialRampToValueAtTime(
                    880,
                    now + 0.16
                );

                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.18,
                    now + 0.02
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.28
                );

                oscillator.start(now);
                oscillator.stop(now + 0.3);
            } else {
                oscillator.frequency.setValueAtTime(
                    620,
                    now
                );

                oscillator.frequency.exponentialRampToValueAtTime(
                    300,
                    now + 0.22
                );

                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.16,
                    now + 0.02
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.3
                );

                oscillator.start(now);
                oscillator.stop(now + 0.32);
            }
        };

    if (context.state === 'suspended') {
        context.resume().then(continueSound);
    } else {
        continueSound();
    }
}


/* =========================================================
   COCHONNETTE GLOBALE À L'APPLICATION
========================================================= */

function updatePiggyDisplay() {
    const pageTotal =
        document.getElementById(
            'piggy-page-total'
        );

    if (pageTotal) {
        pageTotal.textContent =
            formatMoney(totalSavings);
    }
}

function savePiggyGoal() {
    const input =
        document.getElementById(
            'piggy-goal'
        );

    if (!input) {
        return;
    }

    const goal =
        Number(input.value);

    if (
        input.value === '' ||
        !Number.isFinite(goal) ||
        goal < 0
    ) {
        alert('Entre un objectif valide.');
        return;
    }

    piggyGoal = goal;

    saveData();
    updatePiggyProgress();

    alert('Objectif enregistré.');
}

function updatePiggyProgress() {
    const progressText =
        document.getElementById(
            'piggy-progress-text'
        );

    const goalText =
        document.getElementById(
            'piggy-goal-text'
        );

    const progressFill =
        document.getElementById(
            'piggy-progress-fill'
        );

    if (
        !progressText ||
        !goalText ||
        !progressFill
    ) {
        return;
    }

    if (piggyGoal <= 0) {
        progressText.textContent = '0 %';
        goalText.textContent =
            'Objectif : aucun';

        progressFill.style.width = '0%';
        return;
    }

    const percentage =
        Math.min(
            Math.round(
                (totalSavings / piggyGoal) * 100
            ),
            100
        );

    progressText.textContent =
        percentage + ' %';

    goalText.textContent =
        'Objectif : ' +
        formatMoney(piggyGoal);

    progressFill.style.width =
        percentage + '%';
}

function addSavings() {
    const value =
        prompt(
            'Combien veux-tu ajouter dans ta cochonnette ?'
        );

    if (value === null) {
        return;
    }

    const amount =
        Number(value);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert('Entre un montant valide.');
        return;
    }

    totalSavings += amount;

    saveData();
    updatePiggyDisplay();
    updatePiggyProgress();
    updateDashboard();

    playPiggySound('add');

    alert(
        formatMoney(amount) +
        ' ajoutés dans ta cochonnette.'
    );
}

function removeSavings() {
    if (totalSavings <= 0) {
        alert('Ta cochonnette est vide.');
        return;
    }

    const value =
        prompt(
            'Combien veux-tu retirer ? Disponible : ' +
            formatMoney(totalSavings)
        );

    if (value === null) {
        return;
    }

    const amount =
        Number(value);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert('Entre un montant valide.');
        return;
    }

    if (amount > totalSavings) {
        alert(
            'Le retrait est supérieur aux économies disponibles.'
        );
        return;
    }

    totalSavings -= amount;

    saveData();
    updatePiggyDisplay();
    updatePiggyProgress();
    updateDashboard();

    playPiggySound('remove');

    alert(
        formatMoney(amount) +
        ' retirés de ta cochonnette.'
    );
}


/* =========================================================
   BILAN MENSUEL
========================================================= */

function updateMonthlyBalance() {
    const container =
        document.getElementById(
            'months-history'
        );

    if (!container) {
        return;
    }

    const monthKeys =
        Object.keys(expenses);

    if (monthKeys.length === 0) {
        container.innerHTML =
            '<p>Aucun bilan mensuel disponible.</p>';
        return;
    }

    monthKeys.sort(function (a, b) {
        const partsA =
            a.split('-').map(Number);

        const partsB =
            b.split('-').map(Number);

        return (
            partsB[0] - partsA[0] ||
            partsB[1] - partsA[1]
        );
    });

    let html = '';

    monthKeys.forEach(function (
        monthKey
    ) {
        const parts =
            monthKey.split('-');

        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]);

        const data =
            expenses[monthKey] || {
                details: [],
                completed: false
            };

        const details =
            Array.isArray(data.details)
                ? data.details
                : [];

        const totalSpent =
            details.reduce(function (
                total,
                item
            ) {
                return total +
                    Number(item.amount || 0);
            }, 0);

        const remaining =
            monthlyBudget - totalSpent;

        const itemId =
            'month-' +
            year +
            '-' +
            month;

        const status =
            data.completed
                ? '✅ Terminé'
                : '⏳ En cours';

        html += `
            <div
                class="history-item"
                id="${itemId}"
            >
                <button
                    type="button"
                    class="history-month-title"
                    onclick="
                        toggleMonthDetails('${itemId}')
                    "
                >
                    <span>
                        📅
                        ${getMonthName(month)}
                        ${year}
                    </span>

                    <span
                        class="history-month-actions"
                    >
                        <span
                            class="month-completed-label"
                        >
                            ${status}
                        </span>

                        <span
                            class="history-month-arrow"
                        >
                            ▶
                        </span>

                        <span
                            class="delete-month-button"
                            onclick="
                                event.stopPropagation();
                                deleteMonth('${monthKey}')
                            "
                            title="Supprimer ce mois"
                            aria-label="Supprimer ce mois"
                        >
                            🗑️
                        </span>
                    </span>
                </button>

                <div
                    class="history-month-content"
                >
                    <div
                        class="history-stats"
                    >
                        <div
                            class="history-stat"
                        >
                            Budget<br>
                            <strong>
                                ${formatMoney(
                                    monthlyBudget
                                )}
                            </strong>
                        </div>

                        <div
                            class="history-stat"
                        >
                            Dépensé<br>
                            <strong>
                                ${formatMoney(
                                    totalSpent
                                )}
                            </strong>
                        </div>

                        <div
                            class="history-stat"
                        >
                            Reste<br>
                            <strong>
                                ${formatMoney(
                                    remaining
                                )}
                            </strong>
                        </div>
                    </div>

                    <div
                        class="month-expenses"
                    >
                        ${createMonthExpensesHtml(
                            data.details
                        )}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleMonthDetails(itemId) {
    const item =
        document.getElementById(itemId);

    if (item) {
        item.classList.toggle('open');
    }
}

function createMonthExpensesHtml(details) {
    if (
        !Array.isArray(details) ||
        details.length === 0
    ) {
        return '<p>Aucune dépense enregistrée.</p>';
    }

    let html =
        '<h3>Dépenses du mois</h3>';

    details.forEach(function (item) {
        html += `
            <div class="balance-item">
                <strong>
                    ${formatMoney(item.amount)}
                </strong>
                -
                ${escapeHtml(item.description)}
                <br>
                <small>
                    ${escapeHtml(item.date)}
                </small>
            </div>
        `;
    });

    return html;
}

function deleteMonth(monthKey) {
    const currentKey =
        getMonthKey();

    if (monthKey === currentKey) {
        alert(
            'Tu ne peux pas supprimer le mois actuellement affiché.'
        );
        return;
    }

    if (!expenses[monthKey]) {
        return;
    }

    const parts =
        monthKey.split('-');

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const confirmation =
        confirm(
            'Supprimer définitivement ' +
            getMonthName(month) +
            ' ' +
            year +
            ' ?\n\n' +
            'Toutes les dépenses de ce mois seront supprimées.'
        );

    if (!confirmation) {
        return;
    }

    delete expenses[monthKey];

    if (lastSavedMonth === monthKey) {
        lastSavedMonth = '';
    }

    saveData();
    updateMonthlyBalance();

    alert(
        getMonthName(month) +
        ' ' +
        year +
        ' a été supprimé.'
    );
}


/* =========================================================
   BUDGET GLOBAL À L'APPLICATION
========================================================= */

function changeBudget() {
    const value =
        prompt(
            'Nouveau budget mensuel en DH :'
        );

    if (value === null) {
        return;
    }

    const newBudget =
        Number(value);

    if (
        !Number.isFinite(newBudget) ||
        newBudget <= 0
    ) {
        alert('Entre un budget valide.');
        return;
    }

    monthlyBudget = newBudget;

    saveData();
    updateDashboard();

    alert(
        'Budget modifié à ' +
        formatMoney(newBudget) +
        '.'
    );
}

function changeCode() {
    const newCode =
        prompt(
            'Nouveau code à 4 chiffres :'
        );

    if (newCode === null) {
        return;
    }

    if (!/^\d{4}\$/.test(newCode)) {
        alert(
            'Le code doit contenir exactement 4 chiffres.'
        );
        return;
    }

    const confirmation =
        prompt(
            'Confirme le nouveau code :'
        );

    if (newCode !== confirmation) {
        alert('Les codes ne correspondent pas.');
        return;
    }

    accessCode = newCode;
    saveData();

    alert('Code PIN modifié.');
}


/* =========================================================
   THÈMES
========================================================= */

function setTheme(themeName) {
    if (!THEME_NAMES.includes(themeName)) {
        return;
    }

    document.body.className =
        'theme-' + themeName;

    localStorage.setItem(
        'budgetTheme',
        themeName
    );
}

function loadTheme() {
    const savedTheme =
        localStorage.getItem(
            'budgetTheme'
        );

    if (
        savedTheme &&
        THEME_NAMES.includes(savedTheme)
    ) {
        setTheme(savedTheme);
    } else {
        setTheme('beige');
    }
}


/* =========================================================
   RÉINITIALISATION
========================================================= */

function resetApplication() {
    const answer =
        confirm(
            'Toutes les données seront supprimées. Continuer ?'
        );

    if (!answer) {
        return;
    }

    localStorage.removeItem('budgetApp');
    localStorage.removeItem('budgetTheme');

    location.reload();
}


/* =========================================================
   SAUVEGARDE ET CHARGEMENT
========================================================= */

function saveData() {
    localStorage.setItem(
        'budgetApp',
        JSON.stringify({
            monthlyBudget: monthlyBudget,
            accessCode: accessCode,
            currentMonth: currentMonth,
            currentYear: currentYear,
            expenses: expenses,
            totalSavings: totalSavings,
            piggyGoal: piggyGoal,
            lastSavedMonth: lastSavedMonth
        })
    );
}

function loadData() {
    const savedData =
        localStorage.getItem(
            'budgetApp'
        );

    if (!savedData) {
        return;
    }

    try {
        const data =
            JSON.parse(savedData);

        monthlyBudget =
            Number(
                data.monthlyBudget || 0
            );

        accessCode =
            data.accessCode || '';

        currentMonth =
            Number(
                data.currentMonth || 0
            );

        currentYear =
            Number(
                data.currentYear || 2026
            );

        expenses =
            data.expenses || {};

        totalSavings =
            Number(
                data.totalSavings || 0
            );

        piggyGoal =
            Number(
                data.piggyGoal || 0
            );

        lastSavedMonth =
            data.lastSavedMonth || '';

        ensureMonthExists();
    } catch (error) {
        localStorage.removeItem(
            'budgetApp'
        );
    }
}
