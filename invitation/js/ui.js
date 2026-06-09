import { dom } from './dom.js';

export function initUI() {
    dom.scrollToggle.addEventListener('click', () => {
        const isHidden = dom.scrollOverlay.classList.contains('hidden');
        if (isHidden) {
            dom.scrollOverlay.classList.remove('hidden');
            dom.scrollToggle.textContent = "Close Summons";
        } else {
            dom.scrollOverlay.classList.add('hidden');
            dom.scrollToggle.textContent = "Read Summons";
        }
    });

    dom.scrollOverlay.addEventListener('click', (e) => {
        if (e.target === dom.scrollOverlay) {
            dom.scrollOverlay.classList.add('hidden');
            dom.scrollToggle.textContent = "Read Summons";
        }
    });

    dom.scrollClose.addEventListener('click', () => {
        dom.scrollOverlay.classList.add('hidden');
        dom.scrollToggle.textContent = "Read Summons";
    });

    dom.btnRsvpTrigger.addEventListener('click', () => {
        dom.scrollOverlay.classList.add('hidden');
        dom.scrollToggle.textContent = "Read Summons";

        dom.rsvpModal.classList.remove('hidden');
        dom.rsvpForm.classList.remove('hidden');
        dom.rsvpSuccess.classList.add('hidden');
    });

    dom.rsvpClose.addEventListener('click', () => dom.rsvpModal.classList.add('hidden'));
    dom.rsvpModal.addEventListener('click', (e) => {
        if (e.target === dom.rsvpModal) dom.rsvpModal.classList.add('hidden');
    });

    dom.rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const guestName = document.getElementById('rsvp-name').value;
        const selectedHouse = document.getElementById('rsvp-house');
        const houseText = selectedHouse.options[selectedHouse.selectedIndex].text;
        const status = document.querySelector('input[name="rsvp-status"]:checked').value;

        dom.rsvpForm.classList.add('hidden');
        dom.rsvpSuccess.classList.remove('hidden');

        if (status === 'accept') {
            dom.rsvpSuccessText.textContent = `A raven is sent to ${houseText}. The roster has been marked for the arrival of ${guestName}.`;
        } else {
            dom.rsvpSuccessText.textContent = `Regrets have been received from ${guestName}. Your absence has been chronicled in the scrolls of ${houseText}.`;
        }
    });
}
