import Functions from "../Functions.js";

export default class DarkSkullSpell{
    constructor() {
        this.client_img_path = './sprites/game/Spell_Toxic_Cloud.gif'
        this.cd = 2000
        this.energy_cost = 25
        this.special_cost = 50
        this.special_cd = 6000
    }

    special(game, player){
        player.energy -= this.special_cost
        game.spells.push(this.getBigSkull(player.angle, player.x, player.y, player, this.getSkull))
    }

    cast(game, player){
        player.energy -= this.energy_cost
        let start_angle = player.angle - 25
        let angle_step = 10

        for(let i = 1; i <= 5; i++){
            let end = start_angle + angle_step
            let skull_angle = Math.random() * (end - start_angle) + start_angle
            game.spells.push(this.getSkull(skull_angle, player.x, player.y, player))
            start_angle = end
        }
    }

    getBigSkull(angle, x, y, player, cb){
        return {
            radius: 0.2,
            speed: 0.12,
            x: x,
            y: y,
            angle: angle,
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'big_dark_skull',
            owner_s_id: player.socket_id,
            explodeBigSkull: function (game, x, y, player){
                let start = 0
                while (start <= 360){
                    game.spells.push(cb(start, x + Math.sin(start) * 0.8, y + Math.cos(start) * 0.8, player))
                    start += 9
                }
            },
            act: function (game) {
                let layout = game.map.getLayout()

                if (layout[Math.floor(this.y)][Math.floor(this.x)] !== 0) {
                    this.explodeBigSkull(game, this.x, this.y, player)
                    game.spells = game.spells.filter(elem => elem !== this)
                    game.io.sockets.emit('delete_sprite', this.id);
                    return
                }
                let back_players = Object.values(game.players)

                for (let i = 0; i < back_players.length; i++) {
                    if (back_players[i].isDead()) continue
                    if (back_players[i].socket_id === this.owner_s_id) continue

                    let hit = Math.sqrt(Math.pow(this.x - back_players[i].x, 2) + Math.pow(this.y - back_players[i].y, 2)) < (back_players[i].radius + this.radius)
                    if (hit) {
                        this.explodeBigSkull(game, this.x, this.y, player)
                        game.spells = game.spells.filter(elem => elem !== this)
                        game.io.sockets.emit('delete_sprite', this.id);
                        return
                    }
                }

                this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
            }
        }
    }

    getSkull(angle, x, y, player){
        return {
            radius: 0.15,
            damage: 30,
            speed: 0.2,
            x: x,
            y: y,
            angle: angle,
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'dark_skull',
            owner_s_id: player.socket_id,
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
                        back_players[i].spellHit(game, player, this.damage + player.power, this.angle)
                        game.spells = game.spells.filter(elem => elem !== this)
                        game.io.sockets.emit('delete_sprite', this.id);
                    }
                }

                this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
            }
        }
    }

}