const API_BASE = 'http://localhost:3000/api';
let selectedItemId = null;

// Elementos DOM
const itemForm = document.getElementById('itemForm');
const itemsList = document.getElementById('itemsList');
const criteriaForm = document.getElementById('criteriaForm');
const criteriaSection = document.getElementById('criteriaSection');
const selectedItemName = document.getElementById('selectedItemName');
const criteriaList = document.getElementById('criteriaList');

// Cadastrar item
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('itemName').value;
    const description = document.getElementById('itemDescription').value;
    
    try {
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description }),
        });
        
        if (response.ok) {
            itemForm.reset();
            loadItems();
        } else {
            alert('Erro ao cadastrar item');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
});

// Carregar itens
async function loadItems() {
    try {
        const response = await fetch(`${API_BASE}/items`);
        const data = await response.json();
        
        // Check if response is successful and data is an array
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const items = Array.isArray(data) ? data : [];
        
        itemsList.innerHTML = '';
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            if (item.id === selectedItemId) {
                itemCard.classList.add('selected');
            }
            
            itemCard.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description || 'Sem descrição'}</p>
            `;
            
            itemCard.addEventListener('click', () => selectItem(item));
            itemsList.appendChild(itemCard);
        });
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
    }
}

// Selecionar item
function selectItem(item) {
    selectedItemId = item.id;
    selectedItemName.textContent = item.name;
    criteriaSection.style.display = 'block';
    loadCriteria(item.id);
    loadItems(); // Recarregar para atualizar seleção visual
}

// Cadastrar critério
criteriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedItemId) {
        alert('Selecione um item primeiro');
        return;
    }
    
    const name = document.getElementById('criteriaName').value;
    
    try {
        const response = await fetch(`${API_BASE}/criteria`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: selectedItemId, name }),
        });
        
        if (response.ok) {
            document.getElementById('criteriaName').value = '';
            loadCriteria(selectedItemId);
        } else {
            alert('Erro ao adicionar critério');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
});

// Carregar critérios
async function loadCriteria(itemId) {
    try {
        const response = await fetch(`${API_BASE}/items/${itemId}/criteria`);
        const criteria = await response.json();
        
        criteriaList.innerHTML = '';
        criteria.forEach(criterion => {
            const criteriaItem = document.createElement('div');
            criteriaItem.className = 'criteria-item';
            criteriaItem.textContent = criterion.name;
            criteriaList.appendChild(criteriaItem);
        });
    } catch (error) {
        console.error('Erro ao carregar critérios:', error);
    }
}

// Carregar itens ao iniciar
document.addEventListener('DOMContentLoaded', loadItems);