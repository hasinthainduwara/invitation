/* DOM element references */
export const dom = {
    splashScreen: null,
    progressBar: null,
    loadingText: null,
    loadingPercentage: null,
    enterBtn: null,
    progressWrapper: null,
    uiOverlay: null,
    audioToggle: null,
    scrollToggle: null,
    controlsToggle: null,
    helpCard: null,
    helpClose: null,
    objectCard: null,
    objectTitle: null,
    objectDescription: null,
    objectClose: null,
    scrollOverlay: null,
    btnRsvpTrigger: null,
    rsvpModal: null,
    rsvpClose: null,
    rsvpForm: null,
    rsvpSuccess: null,
    rsvpSuccessText: null
};

export function initDom() {
    dom.splashScreen = document.getElementById('splash-screen');
    dom.progressBar = document.getElementById('progress-bar');
    dom.loadingText = document.getElementById('loading-text');
    dom.loadingPercentage = document.getElementById('loading-percentage');
    dom.enterBtn = document.getElementById('enter-btn');
    dom.progressWrapper = document.querySelector('.progress-wrapper');

    dom.uiOverlay = document.getElementById('ui-overlay');
    dom.audioToggle = document.getElementById('audio-toggle');
    dom.scrollToggle = document.getElementById('scroll-toggle');
    dom.controlsToggle = document.getElementById('controls-toggle');

    dom.helpCard = document.getElementById('help-card');
    dom.helpClose = document.getElementById('help-close');

    dom.objectCard = document.getElementById('object-card');
    dom.objectTitle = document.getElementById('object-title');
    dom.objectDescription = document.getElementById('object-description');
    dom.objectClose = document.getElementById('object-close');

    dom.scrollOverlay = document.getElementById('scroll-overlay');
    dom.btnRsvpTrigger = document.getElementById('btn-rsvp-trigger');

    dom.rsvpModal = document.getElementById('rsvp-modal');
    dom.rsvpClose = document.getElementById('rsvp-close');
    dom.rsvpForm = document.getElementById('rsvp-form');
    dom.rsvpSuccess = document.getElementById('rsvp-success');
    dom.rsvpSuccessText = document.getElementById('rsvp-success-text');
}
