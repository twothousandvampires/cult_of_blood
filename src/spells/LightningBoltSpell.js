import Functions from "../Functions.js";
export default class LightningBoltSpell{
    constructor() {
        this.count = 100
        this.client_img_path = './sprites/game/Spell_Static_Charge.gif'
        this.cd = 250
    }
    cast({ spells }, player){
        spells.push({
            damage: 1,
            speed: 0.1,
            x: player.x,
            y: player.y,
            angle: player.angle,
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'ball_lightning',
            owner_id: player.socket_id,
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

                    let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < 0.3
                    if(hit){
                        game.hitPlayer(this.owner_id, back_players[i].socket_id, this.angle, this.damage)
                    }
                }

                this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
            }
        })
    }
}