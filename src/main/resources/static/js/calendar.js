const calendarEl = document.getElementById('calendar');
const calendarTitle = document.getElementById('calendarTitle');
const calendarSubtitle = document.getElementById('calendarSubtitle');
const newEventBtn = document.getElementById('newEventBtn');

const eventModal = document.getElementById('eventModal');
const eventModalTitle = document.getElementById('eventModalTitle');
const eventModalBody = document.getElementById('eventModalBody');
const eventModalActions = document.getElementById('eventModalActions');

const eventFormModal = document.getElementById('eventFormModal');
const eventForm = document.getElementById('eventForm');
const eventFormTitle = document.getElementById('eventFormTitle');
const cancelEventBtn = document.getElementById('cancelEvent');

let calendar;
let currentUser;
let selectedEventId = null;

const params = new URLSearchParams(window.location.search);
const targetUserId = params.get('userId');

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function closeAllModals() {
    closeModal(eventModal);
    closeModal(eventFormModal);
}

function formatDateTime(value) {
    if (!value) {
        return 'Sem horário definido';
    }
    return new Date(value).toLocaleString('pt-br', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

async function loadProfile() {
    const response = await fetch('/api/me');
    if (!response.ok) {
        window.location.href = '/login.html';
        return;
    }
    currentUser = await response.json();
}

async function loadEvents() {
    if (currentUser.role === 'ROLE_ADMIN' && !targetUserId) {
        calendarSubtitle.textContent = 'Selecione um atleta na lista para gerenciar o calendário.';
        newEventBtn.style.display = 'none';
        return [];
    }

    const endpoint = currentUser.role === 'ROLE_ADMIN'
        ? `/api/admin/users/${targetUserId}/events`
        : '/api/me/events';

    const response = await fetch(endpoint);
    if (!response.ok) {
        return [];
    }
    return await response.json();
}

function resetForm() {
    eventForm.reset();
    selectedEventId = null;
}

function openEventForm(mode, eventData) {
    eventFormTitle.textContent = mode === 'edit' ? 'Editar Treino' : 'Novo Treino';
    if (eventData) {
        document.getElementById('title').value = eventData.title || '';
        document.getElementById('startDate').value = eventData.start ? eventData.start.slice(0, 16) : '';
        document.getElementById('endDate').value = eventData.end ? eventData.end.slice(0, 16) : '';
        document.getElementById('description').value = eventData.description || '';
        selectedEventId = eventData.id;
    } else {
        resetForm();
    }
    openModal(eventFormModal);
}

function showEventDetails(eventData) {
    eventModalTitle.textContent = eventData.title;
    eventModalBody.innerHTML = `
        <p><strong>Início:</strong> ${formatDateTime(eventData.start)}</p>
        <p><strong>Fim:</strong> ${formatDateTime(eventData.end)}</p>
        <p><strong>Descrição:</strong> ${eventData.description || 'Sem observações.'}</p>
    `;
    eventModalActions.innerHTML = '';

    if (currentUser.role === 'ROLE_ADMIN') {
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => {
            closeModal(eventModal);
            openEventForm('edit', eventData);
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', async () => {
            await deleteEvent(eventData.id);
            closeModal(eventModal);
        });

        eventModalActions.append(editButton, deleteButton);
    }

    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-outline';
    closeButton.textContent = 'Fechar';
    closeButton.addEventListener('click', () => closeModal(eventModal));
    eventModalActions.appendChild(closeButton);

    openModal(eventModal);
}

async function createEvent(payload) {
    const response = await fetch(`/api/admin/users/${targetUserId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (response.ok) {
        const newEvent = await response.json();
        calendar.addEvent(newEvent);
    }
}

async function updateEvent(payload) {
    const response = await fetch(`/api/admin/users/${targetUserId}/events/${selectedEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (response.ok) {
        const updated = await response.json();
        const event = calendar.getEventById(selectedEventId);
        if (event) {
            event.setProp('title', updated.title);
            event.setStart(updated.start);
            event.setEnd(updated.end);
            event.setExtendedProp('description', updated.description);
        }
    }
}

async function deleteEvent(eventId) {
    await fetch(`/api/admin/users/${targetUserId}/events/${eventId}`, { method: 'DELETE' });
    const event = calendar.getEventById(eventId);
    if (event) {
        event.remove();
    }
}

async function initCalendar() {
    await loadProfile();

    if (currentUser.role === 'ROLE_ADMIN') {
        calendarTitle.textContent = 'Calendário do atleta';
        if (!targetUserId) {
            calendarSubtitle.textContent = 'Escolha um atleta no painel principal.';
        }
    }

    const events = await loadEvents();

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        events,
        eventClick: (info) => {
            const eventData = {
                id: info.event.id,
                title: info.event.title,
                start: info.event.startStr,
                end: info.event.endStr,
                description: info.event.extendedProps.description
            };
            showEventDetails(eventData);
        }
    });

    calendar.render();

    if (currentUser.role !== 'ROLE_ADMIN' || !targetUserId) {
        newEventBtn.style.display = 'none';
    }
}

newEventBtn.addEventListener('click', () => openEventForm('create'));

cancelEventBtn.addEventListener('click', () => closeModal(eventFormModal));

eventForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
        title: document.getElementById('title').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value || null,
        description: document.getElementById('description').value
    };

    if (selectedEventId) {
        await updateEvent(payload);
    } else {
        await createEvent(payload);
    }

    closeModal(eventFormModal);
    resetForm();
});

eventModal.addEventListener('click', (event) => {
    if (event.target === eventModal) {
        closeModal(eventModal);
    }
});

eventFormModal.addEventListener('click', (event) => {
    if (event.target === eventFormModal) {
        closeModal(eventFormModal);
    }
});

initCalendar();
