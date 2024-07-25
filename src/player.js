import Functions from "./Functions.js";
import e from "express";

export default class Player{

    static RADIUS = 0.15
    static STATE_DEAD = 4
    static STATE_IDLE = 1
    static STATE_MOVE = 2
    static GAME_STATE_WEAPON = 1
    static GAME_STATE_CASTING = 2

    static DEFAULT_MIN_DISTANCE = 1
    static DEFAULT_MAX_DISTANCE = 5
    static WEAPON_SWORD = 1
    static WEAPON_STAFF = 2
    constructor(socket_id, nick, skin, weapon = Player.WEAPON_SWORD) {
        this.radius = 0.2
        this.socket_id = socket_id
        this.x = 5
        this.y = 5
        this.angle = 0
        this.nick = nick
        this.hp = 100
        this.state = Player.STATE_IDLE
        this.texture_id = skin
        this.is_attack = false
        this.in_block = false
        this.movement_speed = 0.04
        this.energy = 100
        this.ammo = 5
        this.move_back = false
        this.kills = 0
        this.power = 0
        this.game_state = Player.GAME_STATE_WEAPON
        this.weapon = +weapon
        this.change_state_cd = false
        this.is_special = false
        this.min_distance = Player.DEFAULT_MIN_DISTANCE
        this.max_distance = Player.DEFAULT_MAX_DISTANCE
        this.energy_regen = 2
        this.is_invulnerable = false
        this.is_invisible = false
        if(this.weapon == 2){
            this.is_invisible = true
        }
    }
    revive(map, players){
        this.state = Player.STATE_IDLE
        this.hp = 100
        this.angle = 0
        this.energy = 100
        this.ammo = 10
        this.is_attack = false
        this.in_block = false
        this.movement_speed = 0.04
        this.move_back = false
        this.power = 0
        this.is_special = false
        this.calcPosition(map, players)
    }
    changeGameState(socket){
        if(this.change_state_cd) return
        if(this.game_state === Player.GAME_STATE_WEAPON && !this.spell) return;
        if(this.is_special) return;

        if(this.game_state === Player.GAME_STATE_WEAPON){
            this.game_state = Player.GAME_STATE_CASTING
            socket.emit('set_cast_mode', this.spell)

        }
        else {
            this.game_state = Player.GAME_STATE_WEAPON
            socket.emit('set_weapon_mode', this.weapon)
        }
        this.is_attack = false
        this.in_block = false
        this.is_special = false

        this.change_state_cd = true
        this.energy -= 5
        if(this.energy < 0){
            this.energy = 0
        }
        setTimeout(()=>{
            this.change_state_cd = false
        }, 1500)
}

    calcPosition(map, players){
        players = Object.values(players)
        let spots = map.respawn_spots
        let available = []
        spots.forEach(spot => {
            let empty = players.every(player => {
                return !Functions.circleCollision(player, spot, Player.RADIUS * 2)
            })
            if(empty){
                available.push(spot)
            }
        })
        let spot = available[Math.floor(Math.random() * available.length)]
        this.x = spot.x
        this.y = spot.y
    }
    newSpell(spell){
        this.spell = spell
        this.is_special = false
    }
    isDead(){
        return this.state === Player.STATE_DEAD
    }
    isInvulnerable(){
        return this.is_invulnerable
    }
    isInvisible(){
        return this.is_invisible
    }
    startSpecial(){
        if(this.is_special) return

        this.is_special = true
        if(this.game_state === Player.GAME_STATE_CASTING){

        }
        else {
            switch (this.weapon){
                case Player.WEAPON_SWORD:
                    this.in_block = true
                    this.movement_speed -= 0.02
                    break
                case Player.WEAPON_STAFF:
                    this.energy_regen += 5
                    break
            }
        }
    }

    endSpecial(game){
        if(!this.is_special) return

        this.is_special = false



        if(this.game_state === Player.GAME_STATE_CASTING){
            if(this.spell.special_end !== undefined){
                this.spell.special_end(game)
            }
        }
        else {
            switch (this.weapon){
                case Player.WEAPON_SWORD:
                    this.in_block = false
                    this.movement_speed += 0.02
                    break
                case Player.WEAPON_STAFF:
                    this.energy_regen -= 5
                    break
            }
        }
    }
    specialCast(game){
        if(!this.spell) return
        if(!this.isEnoughEnergy(this.spell.special_cost)) return

        this.spell.special(game, this)
    }

    energyRegen(){
        this.energy += this.energy_regen
        if(this.energy > 100) this.energy = 100
    }

    isEnoughEnergy(energy){
        return this.energy >= energy
    }

    cast(game){
        if(!this.spell) return
        if(!this.isEnoughEnergy(this.spell.energy_cost)) return

        this.spell.cast(game, this)
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
            if(b_player === this || b_player.isDead()) continue

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
            this.state = Player.STATE_IDLE
        }
        else {
            this.state = Player.STATE_MOVE
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
    getWeaponDamage(){
        switch (this.weapon){
            case Player.WEAPON_SWORD:
                return Math.round(10 + Math.random() * (16 - 10)) + (Math.round(this.power) / 2)
            case Player.WEAPON_STAFF:
                return Math.round(10 + Math.random() * (22 - 10)) + (Math.round(this.power) / 2)
        }
    }

    weaponHit(game, player){
        if(this.isDead()) return
        if(this.isInvisible()){
            this.is_invisible = false
        }
        // todo add player power
        let damage = player.getWeaponDamage()

        let angle = player.angle
        let weapon = player.weapon


        if(this.energy > 0 && this.in_block && Functions.checkAngleDiffForBlock(this.angle, angle)){

            if(this.move_back){
                damage = Math.round(damage * 0.8)
            }

            this.energy -= damage
            if(this.energy >= 0){
                game.createModal(player.socket_id, 'yellow', 'Block!')
                return
            }

            damage = this.energy * -1
            this.energy = 0
        }

        this.hp -= damage
        if(this.hp <= 0){
            this.state = Player.STATE_DEAD
            if(player.socket_id !== this.socket_id){
                player.kills ++
            }
            game.io.to(this.socket_id).emit('dead')
            game.io.sockets.emit('update_leaderboard', game.players)

            let p_nick = game.getPlayer(player.socket_id).nick
            game.io.sockets.emit('update_log', p_nick + ' killed ' + this.nick)
            game.createBloodOfferingPowerUp(this)
        }
    }

    spellHit(game, player, damage, angle){
        if(this.isDead()) return
        if(this.isInvulnerable()) return

        if(this.isInvisible()){
            this.is_invisible = false
        }

        if(this.energy > 0 && this.in_block && Functions.checkAngleDiffForBlock(this.angle, angle)){

            this.energy -= damage
            if(this.energy >= 0){
                // game.createModal(player.socket_id, 'yellow', 'Block!')
                return
            }

            damage = this.energy * -1
            this.energy = 0
        }

        this.hp -= damage
        if(this.hp <= 0){
            this.state = Player.STATE_DEAD
            if(player.socket_id !== this.socket_id){
                player.kills ++
            }
            game.io.to(this.socket_id).emit('dead')
            game.io.sockets.emit('update_leaderboard', game.players)

            let p_nick = game.getPlayer(player.socket_id).nick
            game.io.sockets.emit('update_log', p_nick + ' killed ' + this.nick)
            game.createBloodOfferingPowerUp(this)
        }
    }
}