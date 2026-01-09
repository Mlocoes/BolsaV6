/**
 * Polyfill/Monkey-patch para forzar 'passive: true' en eventos de scroll
 * Esto resuelve las advertencias "[Violation] Added non-passive event listener" de Handsontable
 */
export function applyPassiveEventsPatch() {
    if (typeof window === 'undefined') return;

    const originalAddEventListener = EventTarget.prototype.addEventListener;

    // Eventos que deben ser pasivos para evitar bloqueos de scroll
    const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];

    EventTarget.prototype.addEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ) {
        let newOptions = options;

        if (passiveEvents.includes(type)) {
            if (typeof options === 'boolean') {
                newOptions = { capture: options, passive: true };
            } else if (typeof options === 'object') {
                newOptions = { ...options, passive: true };
            } else {
                newOptions = { passive: true };
            }
        }

        return originalAddEventListener.call(this, type, listener, newOptions);
    };

    console.log('🔧 Event Listeners patch applied: forced passive mode for touch/wheel events');
}
