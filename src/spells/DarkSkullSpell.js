import Functions from "../Functions.js";

export default class DarkSkullSpell{
    constructor() {
        this.count = 100
        this.client_img_path = './sprites/game/Spell_Toxic_Cloud.gif'
        this.cd = 2000
    }

    cast({ spells }, player){

        let angle_start = 0

        while (angle_start < 360){
            spells.push({
                damage: 30,
                speed: 0.2,
                x: player.x,
                y: player.y,
                angle: angle_start,
                id: 'spell' + Math.floor(Math.random() * 1000000),
                texture_id: 'dark_skull',
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

                        let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < 0.5
                        if(hit){
                            game.hitPlayer(this.owner_id, back_players[i].socket_id, this.angle, this.damage)
                            game.spells = game.spells.filter(elem => elem !== this)
                            game.io.sockets.emit('delete_sprite', this.id);
                        }
                    }

                    this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                    this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
                }
            })
            angle_start += 5
        }
    }

}