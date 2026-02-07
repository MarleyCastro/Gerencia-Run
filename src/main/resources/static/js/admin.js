const userList = document.getElementById('userList');
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

let userToDelete = null;

function openDeleteModal(userId) {
    userToDelete = userId;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    userToDelete = null;
    deleteModal.classList.remove('active');
}

async function fetchUsers() {
    const response = await fetch('/api/admin/users');
    if (!response.ok) {
        userList.innerHTML = '<p class="footer-note">Não foi possível carregar os usuários.</p>';
        return;
    }
    const users = await response.json();
    userList.innerHTML = '';
    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div>
                <h3>${user.username}</h3>
                <p class="footer-note">ID #${user.id}</p>
            </div>
            <div class="nav-actions">
                <button class="btn btn-primary" data-action="manage">Gerenciar</button>
                <button class="btn btn-danger" data-action="delete">Excluir</button>
            </div>
        `;
        item.querySelector('[data-action="manage"]').addEventListener('click', () => {
            window.location.href = `/calendar.html?userId=${user.id}`;
        });
        item.querySelector('[data-action="delete"]').addEventListener('click', () => {
            openDeleteModal(user.id);
        });
        userList.appendChild(item);
    });
}

confirmDelete.addEventListener('click', async () => {
    if (!userToDelete) {
        return;
    }
    const response = await fetch(`/api/admin/users/${userToDelete}`, { method: 'DELETE' });
    if (response.ok) {
        await fetchUsers();
    }
    closeDeleteModal();
});

cancelDelete.addEventListener('click', closeDeleteModal);

deleteModal.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

fetchUsers();
