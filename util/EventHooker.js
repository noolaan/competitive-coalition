/* Designed By Qwerasd#5202 */

const { EventEmitter } = require('events');

class EventHooker {

    constructor(target) {
        if(!(target instanceof EventEmitter)) return new TypeError('Invalid EventEmitter passed to EventHooker.');

        this.target = target;
        this.events = new Map();

    }

    hook(eventName, func) {
        if(this.events.has(eventName)) {
            const funcs = this.events.get(eventName);
            this.events.set(eventName, [ ...funcs, func ]);
        } else {
            this.events.set(eventName, [ func ]);
            this._handleEvent(eventName);
        }
    }

    unhook(eventName, func) {
        if(this.events.has(eventName)) {
            let funcs = this.events.get(eventName);
            const index = funcs.indexOf(func);
            if(index > -1) {
                funcs.splice(index, 1);
                this.events.set(eventName, funcs);
            }
        }
    }

    async _handleEvent(eventName) {
        this.target.on(eventName, (...args) => {
            this.events.get(eventName).forEach(async (f) => {
                const result = f(...args);
                if(f instanceof Promise) await result;
            });
        });
    }

}

module.exports = EventHooker;