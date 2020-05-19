class Resolver {

    constructor(client) {

        Object.defineProperty(this, 'client', { value: client });

    }

    base(str = '', type, exact = true) {
        const search = str.toLowerCase();

        const bases = this.client.registry.commands
            .filter(exact ? filterExact(search) : filterInexact(search));

        return bases[0] || null;
    }

    member(string = '', guild) {

        let user;
        string = string.toLowerCase();

        if(/<@!?(\d{17,19})>/iy.test(string)) {
            const matches = /<@!?(\d{17,19})>/iy.exec(string);
            user = guild ? guild.members.get(matches[1]) : this.client.users.get(matches[1]);
        } else if (/\d{17,19}/iy.test(string)) {
            const matches = /(\d{17,19})/iy.exec(string);
            user = guild ? guild.members.get(matches[1]) : this.client.users.get(matches[1]);
        } else if(/(.{2,32})#(\d{4})/iy.test(string)) {
            const matches = /(.{2,32})#(\d{4})/iy.exec(string);
            user = guild
                ? guild.members.filter(m=>m.user.username === matches[1] && m.user.discriminator === matches[2]).first()
                : this.client.users.filter(u=>u.username === matches[1] && u.discriminator === matches[2]).first();
        }

        return user || null;

    }

}

module.exports = Resolver;

const filterExact = (search) => {
    return mod => mod.id.toLowerCase() === search ||
        mod.resolveable.toLowerCase() === search ||
        (mod.aliases && (mod.aliases.some(ali => `${mod.type}:${ali}`.toLowerCase() === search) ||
        mod.aliases.some(ali => ali.toLowerCase() === search)));
};

const filterInexact = (search) => {
    return mod => mod.id.toLowerCase().includes(search) ||
        mod.resolveable.toLowerCase().includes(search) ||
        (mod.aliases && (mod.aliases.some(ali => `${mod.type}:${ali}`.toLowerCase().includes(search)) ||
        mod.aliases.some(ali => ali.toLowerCase().includes(search))));
};