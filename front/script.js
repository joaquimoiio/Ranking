const API_BASE = 'http://localhost:3000/api';
let selectedItemId = null;
let isLoggedIn = false;

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginDiv = document.getElementById('loginDiv');
const registerDiv = document.getElementById('registerDiv');
const loginSection = document.getElementById('loginSection');
const mainApp = document.getElementById('mainApp');
const itemForm = document.getElementById('itemForm');
const itemsList = document.getElementById('itemsList');
const criteriaForm = document.getElementById('criteriaForm');
const criteriaSection = document.getElementById('criteriaSection');
const selectedItemName = document.getElementById('selectedItemName');
const criteriaList = document.getElementById('criteriaList');

document.getElementById('showRegister').addEventListener('click', () => {
    loginDiv.style.display = 'none';
    registerDiv.style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', () => {
    registerDiv.style.display = 'none';
    loginDiv.style.display = 'block';
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    
    if (!username || !password) return;
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Usuário criado com sucesso!');
            registerDiv.style.display = 'none';
            loginDiv.style.display = 'block';
            registerForm.reset();
        } else {
            alert(data.error || 'Erro ao criar usuário');
        }
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro de conexão');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) return;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        
        if (response.ok) {
            const data = await response.json();
            isLoggedIn = true;
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', username);
            loginSection.style.display = 'none';
            mainApp.style.display = 'block';
            loadItems();
        } else {
            alert('Login inválido');
        }
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro de conexão');
    }
});

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('itemName').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    
    if (!name) return;
    
    try {
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'user-id': localStorage.getItem('userId')
            },
            body: JSON.stringify({ name, description }),
        });
        
        if (response.ok) {
            itemForm.reset();
        }
    } catch (e) {
        console.error('Erro:', e);
    }
});

async function loadItems() {
    try {
        const response = await fetch(`${API_BASE}/items`, {
            headers: { 'user-id': localStorage.getItem('userId') }
        });
        const items = await response.json();
        
        itemsList.innerHTML = '';
        
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            if (item.id === selectedItemId) itemCard.classList.add('selected');

            itemCard.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description || ''}</p>
                <button class="edit-btn" onclick="editItem(${item.id}, '${item.name}', '${item.description || ''}')">✏️</button>
                <button class="delete-btn" onclick="deleteItem(${item.id}, '${item.name}')">X</button>
            `;

            itemCard.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.classList.contains('edit-btn')) return;
                selectItem(item);
            });

            itemsList.appendChild(itemCard);
        });
    } catch (e) {
        console.error('Erro:', e);
    }
}

function selectItem(item) {
    selectedItemId = item.id;
    selectedItemName.textContent = item.name;
    criteriaSection.style.display = 'block';
    loadCriteria(item.id);
    loadItems();
}

criteriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedItemId) return;
    
    const name = document.getElementById('criteriaName').value.trim();
    if (!name) return;
    
    try {
        const response = await fetch(`${API_BASE}/criteria`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'user-id': localStorage.getItem('userId')
            },
            body: JSON.stringify({ item_id: selectedItemId, name }),
        });
        if (response.ok) {
            document.getElementById('criteriaName').value = '';
            loadCriteria(selectedItemId);
        }
    } catch (e) {
        console.error('Erro:', e);
    }
});

async function loadCriteria(itemId) {
    try {
        const response = await fetch(`${API_BASE}/items/${itemId}/criteria`, {
            headers: { 'user-id': localStorage.getItem('userId') }
        });
        const criteria = await response.json();
        
        criteriaList.innerHTML = '';
        criteria.forEach(criterion => {
            const div = document.createElement('div');
            div.className = 'criteria-item';
            div.innerHTML = `
                <span>${criterion.name}</span>
                <input type="number" min="0" max="10" value="${criterion.score || 0}" 
                       onchange="updateScore(${criterion.id}, this.value)">
                <button onclick="editCriteria(${criterion.id}, '${criterion.name}')">✏️</button>
                <button onclick="deleteCriteria(${criterion.id})">X</button>
            `;
            criteriaList.appendChild(div);
        });
    } catch (e) {
        console.error('Erro:', e);
    }
}

async function deleteItem(id, name) {
    if (!confirm(`Excluir "${name}"?`)) return;
    
    try {
        await fetch(`${API_BASE}/items/${id}`, { 
            method: 'DELETE',
            headers: { 'user-id': localStorage.getItem('userId') }
        });
        if (selectedItemId === id) {
            selectedItemId = null;
            criteriaSection.style.display = 'none';
        }
        loadItems();
    } catch (e) {
        console.error('Erro:', e);
    }
}

async function updateScore(criteriaId, score) {
    const numScore = parseFloat(score);
    if (numScore < 0 || numScore > 10) return;
    
    try {
        await fetch(`${API_BASE}/criteria/${criteriaId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'user-id': localStorage.getItem('userId')
            },
            body: JSON.stringify({ score: numScore }),
        });
    } catch (e) {
        console.error('Erro:', e);
    }
}

function editItem(id, name, description) {
    const newName = prompt('Nome do item:', name);
    if (!newName || newName.trim() === '') return;
    
    const newDescription = prompt('Descrição:', description);
    
    fetch(`${API_BASE}/items/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'user-id': localStorage.getItem('userId')
        },
        body: JSON.stringify({ name: newName.trim(), description: newDescription?.trim() || '' }),
    }).then(response => {
        if (response.ok) loadItems();
    }).catch(e => console.error('Erro:', e));
}

function editCriteria(id, name) {
    const newName = prompt('Nome do critério:', name);
    if (!newName || newName.trim() === '') return;
    
    fetch(`${API_BASE}/criteria/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'user-id': localStorage.getItem('userId')
        },
        body: JSON.stringify({ name: newName.trim() }),
    }).then(response => {
        if (response.ok) loadCriteria(selectedItemId);
    }).catch(e => console.error('Erro:', e));
}

async function deleteCriteria(id) {
    try {
        await fetch(`${API_BASE}/criteria/${id}`, { 
            method: 'DELETE',
            headers: { 'user-id': localStorage.getItem('userId') }
        });
        loadCriteria(selectedItemId);
    } catch (e) {
        console.error('Erro:', e);
    }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    isLoggedIn = false;
    selectedItemId = null;
    loginSection.style.display = 'block';
    mainApp.style.display = 'none';
    criteriaSection.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
        isLoggedIn = true;
        loginSection.style.display = 'none';
        mainApp.style.display = 'block';
        loadItems();
    }
});
