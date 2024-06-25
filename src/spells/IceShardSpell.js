import Functions from "../Functions.js";
export default class IceShardSpell{
    constructor() {
        this.energy_cost = 2
        this.special_cost = 6
        this.client_img_path = './sprites/game/Spell_Cold_Beam.gif'
        this.cd = 1200
        this.special_cd = 2000
        this.max_count = 5
        this.count = 0
        this.shards = []
    }
    cast({ spells }, player){
        if(this.count >= this.max_count){
            return
        }
        let angle = Math.random() * 6.24
        player.energy -= this.energy_cost
        let shard = this.getProj(player, angle, this)
        this.shards.push(shard)
        spells.push(shard)
        this.count ++
    }

    isEnoughEnergy(player){
        return player.energy >= this.energy_cost
    }

    isSpecialEnoughEnergy(player){
        return player.energy >= this.special_cost
    }

    special(game, player){
        player.energy -= this.special_cost

        let rayCos = Math.cos(Functions.degreeToRadians(player.angle)) / 32;
        let raySin = Math.sin(Functions.degreeToRadians(player.angle)) / 32;

        let wall = 0

        let ray = {
            x: player.x,
            y: player.y
        }

        let x_col = false
        let y_col = false

        while(!wall) {
            x_col = game.map.layout[Math.floor(ray.y)][Math.floor(ray.x + rayCos)]
            y_col = game.map.layout[Math.floor(ray.y + raySin)][Math.floor(ray.x)]

            if(x_col || y_col){
                wall = 1
            }
            else {
                ray.x += rayCos;
                ray.y += raySin;
            }
        }
        this.shards.forEach(elem => {
            elem.direction(player.angle + Functions.getAnglePoints(ray.x, ray.y, player.x, player.y, elem.x, elem.y))
        })
    }

    getProj(player, angle, spell){
        return {
            damage: 2,
            direct_damage: 35,
            speed: 0.3,
            x: player.x + Math.cos(Functions.degreeToRadians(angle)) / 2,
            y: player.y + Math.sin(Functions.degreeToRadians(angle)) / 2,
            angle: Math.round(angle),
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'ice_shard',
            owner_id: player.socket_id,
            hit: [],
            tick: 0,
            lap: 0,
            direction: function (angle){
              this.angle = angle
              this.direct = true
            },
            act: function (game){
                if(this.direct){
                    let layout = game.map.getLayout()

                    if (layout[Math.floor(this.y)][Math.floor(this.x)] !== 0) {
                        game.spells = game.spells.filter(elem => elem !== this)
                        game.io.sockets.emit('delete_sprite', this.id);
                        spell.shards = spell.shards.filter(elem => elem !== this)
                        spell.count --
                        return
                    }

                    let back_players = Object.values(game.players)
                    for(let i = 0; i < back_players.length; i++){
                        if(back_players[i].isDead()) continue
                        if(back_players[i].socket_id === this.owner_id) continue
                        if(this.hit.includes(back_players[i].socket_id)) continue

                        let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < 0.2
                        if(hit){
                            game.spells = game.spells.filter(elem => elem !== this)
                            game.io.sockets.emit('delete_sprite', this.id);
                            back_players[i].spellHit(game, player, this.direct_damage + player.power, this.angle)
                            spell.count --
                            spell.shards = spell.shards.filter(elem => elem !== this)
                        }
                    }

                    this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                    this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
                }
                else {
                    this.angle += 3

                    if(this.angle >= 360){
                        this.angle = 0
                        this.lap ++
                        if(this.lap >= 10){
                            game.spells = game.spells.filter(elem => elem !== this)
                            game.io.sockets.emit('delete_sprite', this.id);
                            spell.count --
                            spell.shards = spell.shards.filter(elem => elem !== this)
                        }
                        this.hit = []
                    }

                    let back_players = Object.values(game.players)

                    for(let i = 0; i < back_players.length; i++){
                        if(back_players[i].isDead()) continue
                        if(back_players[i].socket_id === this.owner_id) continue
                        if(this.hit.includes(back_players[i].socket_id)) continue

                        let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < 0.2
                        if(hit){
                            this.hit.push(back_players[i].socket_id)
                            back_players[i].spellHit(game, player, this.damage + Math.round(player.power / 3), this.angle)
                        }
                    }

                    this.x = player.x + Math.cos(Functions.degreeToRadians(this.angle)) / 2
                    this.y = player.y + Math.sin(Functions.degreeToRadians(this.angle)) / 2
                }
            }
        }
    }
}