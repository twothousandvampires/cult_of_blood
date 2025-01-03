import Functions from "./Functions.js";

export default class Player{
    static degreeToRadians(degree){
        let pi = Math.PI;
        return degree * pi / 180;
    }
    static RADIUS = 0.15
    static STATE_DEAD = 4
    static STATE_IDLE = 1
    static STATE_MOVE = 2
    static GAME_STATE_WEAPON = 1
    static GAME_STATE_BEAST = 3
    static GAME_STATE_CASTING = 2

    static DEFAULT_MIN_DISTANCE = 1
    static DEFAULT_MAX_DISTANCE = 5
    static WEAPON_SWORD = 1
    static WEAPON_STAFF = 2
    static WEAPON_DAGGER = 3
    static WEAPON_HAND = 4

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
        this.blood_offering_count = 0
        this.blessed = false
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
        this.shield = 0

        this.calcPosition(map, players)
    }
    changeGameState(socket){
        if(this.change_state_cd) return
        if(this.game_state === Player.GAME_STATE_WEAPON && !this.spell) return
        if(this.is_special) return
        if(this.is_beast) return

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
            if(this.is_beast){
                this.movement_speed += 0.08
                this.direction_angle = this.angle
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
    }
    reduceEnergy(amount){
        this.energy -= amount
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
            if(this.is_beast){
                this.movement_speed -= 0.08
                this.direction_angle = undefined
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
                    case Player.WEAPON_DAGGER:
                        if(this.isEnoughEnergy(70)){
                            this.reduceEnergy(70)
                            this.movement_speed -= 0.02
                            this.is_invisible = true
                        }
                        break
                    case Player.WEAPON_HAND:
                        if(this.hp <= 1){
                            return
                        }
                        this.hp -= 10
                        if(this.hp < 0){
                            this.hp = 1
                        }
                        this.power += 10
                        break
                }
            }
        }
    }
    specialCast(game){
        if(!this.spell) return
        if(!this.isEnoughEnergy(this.spell.special_cost)) return

        this.spell.special(game, this)
    }

    energyRegen(game){
        this.energy += this.energy_regen
        if(this.energy > 100) this.energy = 100
        if(this.is_beast){
            this.hp -= 10
            if(this.hp <= 0){
                this.dead(game)
                game.io.to(this.socket_id).emit('dead')
            }
        }
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
        if(this.cannot_action) return

        if(!this.direction_angle){
            this.angle += d.da
        }

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
            if(this.is_beast && this.is_special){
                if((check_x <= Player.RADIUS * 2) || (check_y <= Player.RADIUS * 2)){
                    b_player.weaponHit(game, this)
                }
            }
            else {
                if(this.blessed && (!b_player.is_beast)){
                    b_player.blessed = true
                }
                if(check_x <= Player.RADIUS * 2){
                    d.dx = 0
                }
                if(check_y <= Player.RADIUS * 2){
                    d.dy = 0
                }
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

        let portals = game.map.portals

        portals.forEach(portal => {
            if(Functions.distance(this, portal) < 0.1 && portal.active){
                let to = game.map.portals.find(elem => {
                    return portal.destination === elem.index
                })

                to.active = false
                portal.active = false
                game.io.emit('update_portals', game.map.portals)

                this.x = to.x
                this.y = to.y

                setTimeout(()=>{
                    to.active = true
                    portal.active = true
                    game.io.emit('update_portals', game.map.portals)
                }, 5000)
            }
        })
    }
    getWeaponDamage(){
        if(this.is_beast){
            return Math.round(50 + Math.random() * (70 - 50)) + (Math.round(this.power))
        }
        switch (this.weapon){
            case Player.WEAPON_SWORD:
                return Math.round(15 + Math.random() * (25 - 15)) + (Math.round(this.power) / 2)
            case Player.WEAPON_STAFF:
                return Math.round(20 + Math.random() * (30 - 20)) + (Math.round(this.power) / 2)
            case Player.WEAPON_DAGGER:
                return Math.round(20 + Math.random() * (30 - 20)) + (Math.round(this.power) / 2)
            case Player.WEAPON_HAND:
                return Math.round(20 + Math.random() * (30 - 20)) + (Math.round(this.power) / 2)

        }
    }
    e(game){
        switch (this.weapon){
            case Player.WEAPON_HAND:
                let players = Object.values(game.players)
                for(let i = 0; i < players.length; i++){
                    if(Functions.distance(this, players[i]) < 0.7 && players[i].state === Player.STATE_DEAD){
                        this.shield = 3
                        game.io.to(this.socket_id).emit('set_corpse')
                        return;
                    }
                }
                break
            case Player.WEAPON_SWORD:
                if(this.ammo <= 0) return
                if(this.is_beast){
                    return
                }
                this.ammo --
                game.arrows.push({
                    x: this.x,
                    y: this.y,
                    angle: this.angle,
                    id: 'a' + Math.floor(Math.random() * 1000000),
                    owner_id: this.socket_id
                })
                break
            default:
                return
        }
    }
    TransformIntoBeast(socket){
        socket.to(this.socket_id).emit('set_transform_mode')
        this.cannot_action = true
        this.is_beast = true
        this.movement_speed = 0.08
        this.hp = 200

        setTimeout(()=>{
            socket.to(this.socket_id).emit('set_beast_mode')
            this.previous_texture_id = this.texture_id
            this.texture_id = 'vampire'
            socket.emit('set_texture_id', this.socket_id, this.texture_id)
            this.cannot_action = false
        },2000)
    }
    handAttack(game){
        let player = this
        game.spells.push({
            player: player,
            radius: 0.15,
            damage: 10,
            speed: 0.1,
            x: this.x,
            y: this.y,
            angle: this.angle,
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'necro_skull',
            owner_s_id: this.socket_id,
            act: function (game) {
                let layout = game.map.getLayout()

                if (layout[Math.floor(this.y)][Math.floor(this.x)] !== 0) {
                    game.spells = game.spells.filter(elem => elem !== this)
                    game.io.sockets.emit('delete_sprite', this.id);
                    return
                }
                let back_players = Object.values(game.players)

                for (let i = 0; i < back_players.length; i++) {
                    if (back_players[i].isDead()) continue
                    if (back_players[i].socket_id === player.socket_id) continue

                    let hit = Math.sqrt(Math.pow(this.x - back_players[i].x, 2) + Math.pow(this.y - back_players[i].y, 2)) < (back_players[i].radius + this.radius)
                    if (hit) {
                        let d = this.damage + (player.power * 2)
                        back_players[i].spellHit(game, player, d, this.angle)
                        game.spells = game.spells.filter(elem => elem !== this)
                        this.player.hp += Math.round(d/2)
                        game.io.sockets.emit('delete_sprite', this.id);
                    }
                }

                this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
            }
        })
    }
    checkShield(angle, game){
        if(this.shield && Functions.checkAngleDiffForBlock(this.angle, angle)){
            this.shield --
            if(this.shield == 0){
                game.io.to(this.socket_id).emit('delete_corpse')
            }
            return true
        }
        return false
    }
    weaponHit(game, player){
        if(this.isDead()) return
        if(this.isInvulnerable()) return
        if(this.is_beast && !player.blessed) return;
        if(game.beast_is_spawned && !player.is_beast && !this.is_beast){
            return
        }

        if(this.isInvisible()){
            this.is_invisible = false
            this.movement_speed += 0.02
        }

        // todo add player power
        let damage = player.getWeaponDamage()

        let angle = player.angle

        if(this.checkShield(angle, game)){
            return
        }

        if(player.weapon === Player.WEAPON_DAGGER && Functions.checkAngleDiffForAmbush(this.angle, angle)){
            damage *= 4
        }

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
            this.dead(game)

            if(player.socket_id !== this.socket_id){
                player.kills += this.is_beast ? 5 : 1
            }
            if(player.is_beast){
                player.hp += 20
            }
            game.io.to(this.socket_id).emit('dead')
            game.io.sockets.emit('update_leaderboard', game.players)

            let p_nick = game.getPlayer(player.socket_id).nick
            game.io.sockets.emit('update_log', p_nick + ' killed ' + this.nick)
            game.createBloodOfferingPowerUp(this)
        }
    }
    dead(game){
        this.state = Player.STATE_DEAD
        this.blood_offering_count = 0
        if(this.is_beast){
            this.texture_id = this.previous_texture_id
            this.is_beast = false
            this.movement_speed = 0.04
            this.hp = 100
            game.beastDead()
            game.io.to(this.socket_id).emit('set_weapon_mode', this.weapon)
            game.io.sockets.emit('set_texture_id', this.socket_id, this.texture_id)
        }
    }
    spellHit(game, player, damage, angle){
        if(this.isDead()) return

        if(this.isInvulnerable()) return

        if(this.is_beast && !player.blessed) return

        if(this.checkShield(angle, game)){
            return;
        }

        if(game.beast_is_spawned && !player.is_beast && !this.is_beast){
            return
        }

        if(this.isInvisible()){
            this.is_invisible = false
            this.movement_speed += 0.02
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
            this.dead(game)

            if(player.socket_id !== this.socket_id){
                player.kills += this.is_beast ? 5 : 1
            }
            if(player.is_beast){
                player.hp += 20
            }
            game.io.to(this.socket_id).emit('dead')
            game.io.sockets.emit('update_leaderboard', game.players)

            let p_nick = game.getPlayer(player.socket_id).nick
            game.io.sockets.emit('update_log', p_nick + ' killed ' + this.nick)
            game.createBloodOfferingPowerUp(this)
        }
    }
}