import Functions from "../Functions.js";
export default class LightningBoltSpell{
    constructor() {
        this.energy_cost = 2
        this.special_cost = 4
        this.client_img_path = './sprites/game/Spell_Static_Charge.gif'
        this.cd = 250
        this.special_cd = 150
        this.channeling = true
    }
    cast({ spells }, player){
        player.energy -= this.energy_cost
        spells.push(this.getProj(player))
    }

    special({ spells }, player){
        player.energy -= this.special_cost
        let angle = player.angle + ((Math.random() > 0.5 ? 1 : -1) * Math.random() * 15)

        spells.push(this.getProj(player, angle))
    }

    getProj(player, force_angle = false){
        return {
            damage: 6,
            speed: 0.1,
            x: player.x,
            y: player.y,
            angle: force_angle ? force_angle : player.angle,
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'ball_lightning',
            owner_id: player.socket_id,
            hit: [],
            act: function (game){
                let layout = game.map.getLayout()

                if(layout[Math.floor(this.y)][Math.floor(this.x)] !== 0){
                    game.spells = game.spells.filter(elem => elem !== this)
                    game.io.sockets.emit('delete_sprite', this.id);
                    return
                }
                let back_players = Object.values(game.players)

                for(let i = 0; i < back_players.length; i++){
                    if(back_players[i].isDead()) continue
                    if(back_players[i].socket_id === this.owner_id) continue
                    if(this.hit.includes(back_players[i].socket_id)) continue

                    let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < 0.3
                    if(hit){
                        this.hit.push(back_players[i].socket_id)
                        back_players[i].spellHit(game, player, this.damage + Math.round(player.power / 4), this.angle)
                    }
                }

                this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
            }
        }
    }
}