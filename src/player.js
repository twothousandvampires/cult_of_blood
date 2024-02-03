export default class Player{

    static RADIUS = 0.3
    constructor(socket_id, nick, skin) {
        this.socket_id = socket_id
        this.x = 5
        this.y = 5
        this.angle = 0
        this.nick = nick
        this.ready = false
        this.hp = 100
        this.state = 1
        this.texture_id = skin
        this.attack = false
        this.in_block = false
        this.movement_speed = 0.04
        this.armour = 100
        this.ammo = 10
        this.move_back = false
        this.kills = 0
        this.power = 0
    }
    revive(){
        this.state = 1
        this.hp = 100
        this.x = 5
        this.y = 5
        this.angle = 0
        this.armour = 100
        this.ammo = 10
        this.attack = false
        this.in_block = false
        this.movement_speed = 0.04
        this.move_back = false
        this.power = 0
    }
    calcPosition(index){
        switch (index){
            case 0:
                this.x = 5
                this.y = 5
            break;
            case 1:
                this.x = 4
                this.y = 4
                break;
            case 2:
                break;
            case 3:
                break;
        }
    }
    newSpell(spell){
        this.spell = spell
    }
    isDead(){
        return this.state === 4
    }
    update(d, game){
        this.angle += d.da
        if(this.angle > 360) this.angle -= 360
        if(this.angle < 0) this.angle += 360

        let new_x = this.x + d.dx
        let new_y = this.y + d.dy

        let back_players = Object.values(game.players)

        for(let i = 0; i < back_players.length; i++){

            let b_player = back_players[i]
            if(b_player === this) continue

            let check_x = Math.sqrt(Math.pow(new_x - b_player.x, 2) + Math.pow( this.y - b_player.y, 2))
            let check_y = Math.sqrt(Math.pow(this.x - b_player.x, 2) + Math.pow(new_y - b_player.y, 2))

            if(check_x <= Player.RADIUS * 2){
                d.dx = 0
            }
            if(check_y <= Player.RADIUS * 2){
                d.dy = 0
            }
        }

        if(!d.dx && !d.dy){
            this.state = 1
        }
        else {
            this.state = 2
        }

        if(d.q && this.armour > 0){
            if(!this.in_block){
                this.in_block = true
                this.movement_speed -= 0.02
            }
        }
        else {
            if(this.in_block){
                this.in_block = false
                this.movement_speed += 0.02
            }
        }

        if(d.move_back){
            if(!this.move_back){
                this.move_back = true
                this.movement_speed -= 0.01
            }
        }
        else {
            if (this.move_back) {
                this.move_back = false
                this.movement_speed += 0.01
            }
        }

        this.move_forward = d.move_forward

        this.x += d.dx
        this.y += d.dy
    }
}