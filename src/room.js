export default class Room{
    constructor(creator_id, name) {
        this.creator_id = creator_id
        this.name = name
        this.members = []
    }

    addMember(member_id, nick){
        this.members.push({
            socket_id: member_id,
            nick: nick
        })
    }
}