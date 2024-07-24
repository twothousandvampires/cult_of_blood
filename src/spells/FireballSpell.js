import Player from "../player.js";
import Functions from "../Functions.js";

export default class FireballSpell {
    constructor() {
        this.client_img_path = './sprites/game/Spell_Fireball.gif'
        this.cd = 200
        this.energy_cost = 5
        this.special_cost = 10
        this.special_cd = 500
        this.ball = undefined
        this.accamulate = true
        this.channeling = true
        this.ligth_interval = false
        this.light_radius = 2
    }

    special_end(game){
        if(this.ball){
            this.ball.direct = true
            this.ball = undefined
        }
    }
    special(game, player){
        player.energy -= this.special_cost
        if(!this.ball){
            let ball = this.getFireBall(player)
            this.ball = ball
            game.spells.push(ball)
            return
        }

        this.ball.stage ++
        if(this.ball.stage > 8){
            this.ball.stage = 8
        }
    }

    getFireBall(player){
        return {
            damage: 15,
            speed: 0.12,
            x: player.x + Math.cos(Functions.degreeToRadians(player.angle)) / 2,
            y: player.y + Math.sin(Functions.degreeToRadians(player.angle)) / 2,
            angle: Math.round(player.angle),
            id: 'spell' + Math.floor(Math.random() * 1000000),
            texture_id: 'fireball',
            owner_s_id: player.socket_id,
            stage: 0,
            direct: false,
            damage_radius: 0.5,
            radius: 0.1,
            hit: [],
            timeout: false,
            explosion: function (game){
                let back_players = Object.values(game.players)
                for(let i = 0; i < back_players.length; i++){
                    if(back_players[i].isDead()) continue

                    let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < this.damage_radius * this.stage
                    if(hit){
                        back_players[i].spellHit(game, player, (this.damage + player.power) * this.stage, this.angle)
                    }
                }
            },
            act: function (game) {
                if(this.direct){
                    let layout = game.map.getLayout()

                    if (layout[Math.floor(this.y)][Math.floor(this.x)] !== 0) {
                        this.explosion(game)
                        game.spells = game.spells.filter(elem => elem !== this)
                        game.io.sockets.emit('delete_sprite', this.id);
                        return
                    }

                    let back_players = Object.values(game.players)
                    for(let i = 0; i < back_players.length; i++){
                        if(back_players[i].isDead()) continue
                        if(back_players[i].socket_id === this.owner_s_id) continue

                        let hit = Math.sqrt(Math.pow(this.x- back_players[i].x, 2) + Math.pow( this.y - back_players[i].y, 2)) < this.radius * this.stage
                        if(hit){
                            this.explosion(game)
                            game.spells = game.spells.filter(elem => elem !== this)
                            game.io.sockets.emit('delete_sprite', this.id);
                        }
                    }

                    this.x += Math.cos(Functions.degreeToRadians(this.angle)) * this.speed
                    this.y += Math.sin(Functions.degreeToRadians(this.angle)) * this.speed
                }
                else {
                    if(!this.timeout){
                        this.timeout = true
                        setTimeout(()=>{
                            this.explosion(game)
                            game.spells = game.spells.filter(elem => elem !== this)
                            game.io.sockets.emit('delete_sprite', this.id);
                        }, 8000)
                    }
                    this.angle = player.angle
                    this.x = player.x + Math.cos(Functions.degreeToRadians(this.angle)) / 2
                    this.y = player.y + Math.sin(Functions.degreeToRadians(this.angle)) / 2
                }
            }
        }
    }

    cast(game, player){
       player.energy -= this.energy_cost
       let  players = Object.values(game.players)
        players.forEach(p => {
            if(p.socket_id === player.socket_id){
                p.min_distance += 0.2
                p.max_distance += 0.5
            }
            else if(Functions.distance(player, p) < this.light_radius){
                p.min_distance -= 0.1
                p.max_distance -= 0.5
                if(p.max_distance < 0){
                    p.max_distance = 0
                }
                if(p.min_distance < 0){
                    p.min_distance = 0
                }
            }
        })
        let blind_done = false
        let light_done = false
        if(!this.ligth_interval){
            this.ligth_interval = true
            let i = setInterval(()=>{
                players.forEach(p => {
                    if(p.socket_id === player.socket_id){
                        p.min_distance -= 0.1
                        p.max_distance -= 0.2

                        if(p.min_distance < Player.DEFAULT_MIN_DISTANCE){
                            p.min_distance = Player.DEFAULT_MIN_DISTANCE
                        }
                        if(p.max_distance < Player.DEFAULT_MAX_DISTANCE){
                            p.max_distance = Player.DEFAULT_MAX_DISTANCE
                        }
                        if(p.max_distance === Player.DEFAULT_MAX_DISTANCE &&  p.min_distance === Player.DEFAULT_MIN_DISTANCE){
                            light_done = true
                        }
                    }
                    else {
                        p.min_distance += 0.1
                        p.max_distance += 0.2

                        if(p.min_distance > Player.DEFAULT_MIN_DISTANCE){
                            p.min_distance = Player.DEFAULT_MIN_DISTANCE
                        }
                        if(p.max_distance > Player.DEFAULT_MAX_DISTANCE){
                            p.max_distance = Player.DEFAULT_MAX_DISTANCE
                        }
                        if(p.max_distance === Player.DEFAULT_MAX_DISTANCE &&  p.min_distance === Player.DEFAULT_MIN_DISTANCE){
                            blind_done = true
                        }
                    }
                })
                if(blind_done && light_done){
                    this.ligth_interval = false
                    clearInterval(i)
                }
            },1000)
        }
    }
}