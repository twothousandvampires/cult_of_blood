import Functions from "../Functions.js";

export default class LightningRailSpell{
    constructor() {
        this.client_img_path = './sprites/game/Spell_Lightning_Bolt.gif'
        this.cd = 2000
        this.special_cd = 3000
        this.chain = 4
        this.damage = 199
        this.energy_cost = 35
        this.special_cost = 55
    }
    createRay(game, player, chain = false){
        let angle =  player.angle

        let ray = {
            x: player.x,
            y: player.y
        }

        let rayCos = Math.cos(Functions.degreeToRadians(angle)) / 32;
        let raySin = Math.sin(Functions.degreeToRadians(angle)) / 32;

        let effects = []

        let wall = 0;
        let y_col = false
        let x_col = false

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

            if(!wall){
                effects.push({
                    x: ray.x,
                    y: ray.y,
                    angle: angle,
                    id: 'effect' + Math.floor(Math.random() * 1000000),
                    texture_id: 'rail_lightning'
                })
            }
        }

        this.checkPlayersToHit(game, player, player ,angle, ray)

        game.io.sockets.emit('addEffect', effects);

        if(chain){
            this.chainRail(this.chain, game, angle, player, x_col, ray)
        }
    }

    cast(game, player){
        player.energy -= this.energy_cost
        this.createRay(game, player)
    }

    special(game, player){
        player.energy -= this.special_cost
        this.createRay(game, player, true)
    }
    chainRail(n, game, angle, player, col, ray){
        if(!n) return

        let x = col ? 90 : 0
        let reflected_angle = 2 * x - angle

        let rayCos = Math.cos(Functions.degreeToRadians(reflected_angle)) / 32;
        let raySin = Math.sin(Functions.degreeToRadians(reflected_angle)) / 32;

        let wall = 0
        let effects = []

        let c_ray = {
            x: ray.x,
            y: ray.y
        }

        let x_col = false
        let y_col = false

        while(!wall) {
            x_col = game.map.layout[Math.floor(c_ray.y)][Math.floor(c_ray.x + rayCos)]
            y_col = game.map.layout[Math.floor(c_ray.y + raySin)][Math.floor(c_ray.x)]

            if(x_col || y_col){
                wall = 1
            }
            else {
                c_ray.x += rayCos;
                c_ray.y += raySin;
            }
            if(!wall){
                effects.push({
                    x: c_ray.x,
                    y: c_ray.y,
                    angle: reflected_angle,
                    id: 'effect' + Math.floor(Math.random() * 1000000),
                    texture_id: 'rail_lightning'
                })
            }
        }

        game.io.sockets.emit('addEffect', effects);

        this.checkPlayersToHit(game, player, ray, reflected_angle, c_ray, true)

        this.chainRail(n - 1, game, reflected_angle, player, x_col, c_ray)
    }
    checkPlayersToHit(game, player, start, angle, end, self = false){

        let back_players = Object.values(game.players)
        let already_hit = []

        back_players.forEach(elem => {
            let d = Functions.calcDistanceFromLineToPoint(start, end, elem)
            if(d < elem.radius && !already_hit.includes(elem)){
                if(self && player === elem){
                    elem.spellHit(game, player, this.damage + player.power * 2, angle)
                }
                else if(player !== elem){
                    elem.spellHit(game, player, this.damage + player.power * 2, angle)
                }
                already_hit.push(elem)
            }
        })
    }
}