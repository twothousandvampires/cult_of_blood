import PowerUpCreator from "./creators/PowerUpCreator.js";
import Functions from "./Functions.js";
import Garden from "./maps/Garden.js";
import Player from "./player.js";
export default class GameServer{
    MAX_PLAYERS = 10;
    constructor(io) {
        this.io = io
        this.players_count = 0
        this.players = {}
        this.arrows = []
        this.spells = []
        this.power_ups = []
        this.map = new Garden()
    }
    getRoleForNewPlayer(){
        return this.players_count >= this.MAX_PLAYERS ? 'spec' : 'player'
    }
    addNewPlayer(nick, skin, socket_id){
        let player = new Player(socket_id, nick, skin)
        player.calcPosition(this.players_count)
        this.players[socket_id] = player
    }
    removePlayer(socket_id){
        this.players_count--
        let player = this.getPlayer(socket_id)
        if(!player) return

        delete this.players[socket_id]
    }
    init(){
        this.io.on('connection', (socket) => {
            console.log("!!")
            socket.emit('update_map', this.map.getLayout())
            let role = this.getRoleForNewPlayer()
            socket.emit('get_role', role)

            socket.on('init', (nick, skin)=>{
                this.addNewPlayer(nick, skin, socket.id)
                this.io.sockets.emit('update_leaderboard', this.players)
                socket.emit('update_power_ups', this.power_ups)
            })

            socket.on('hit_player', (socket_id) => {
                this.hitPlayer(socket.id, socket_id, this.players[socket.id].angle)
            })

            socket.on("disconnect", () => {
                this.removePlayer(socket.id)
                this.io.sockets.emit('delete_sprite', socket.id);
                this.io.sockets.emit('update_leaderboard', this.players)
            });

            socket.on('start_attack', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.attack = true
            })
            socket.on('end_attack', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.attack = false
            })

            socket.on('revive', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.revive()
            })

            socket.on('inputs', (d) => {
                const player = this.getPlayer(socket.id)

                if (!player) return
                if(player.isDead()) return

                player.update(d, this)
            });

            socket.on('arrow_shot', () => {
                const player = this.getPlayer(socket.id)

                if(!player) return
                if(player.ammo <= 0) return

                player.ammo --
                this.arrows.push({
                    x: player.x,
                    y: player.y,
                    angle: player.angle,
                    id: 'a' + Math.floor(Math.random() * 1000000),
                    owner_id: socket.id
                })
            })

            socket.on('cast', () => {
                const player = this.getPlayer(socket.id)

                if (!player) return
                if(!player.spell || !player.spell.count) return

                player.spell.count --
                player.spell.cast(this, player)
            })

        })
    }
    generatePowerUp(){
        if(this.power_ups.length < this.map.powerUpSpots.length){
            let spot = this.map.getPossiblePowerUpSpot(this.power_ups)

            let power_up = PowerUpCreator.createRandom()
            if(!power_up || !spot) return

            power_up.setCords(spot.x, spot.y)

            this.power_ups.push(power_up)

            this.io.sockets.emit('update_power_ups', this.power_ups)
        }
    }

    start(){
        setInterval(()=>{
            this.generatePowerUp()
        },15000)

        this.gameLoop =  setInterval(() => {
            this.frame()
            this.io.emit('updatePlayers', this.players)
            this.io.emit('updateArrows', this.arrows)
            this.io.emit('updateSpells', this.spells)
        }, 30)
    }

    getPlayer(socket_id){
        return this.players[socket_id]
    }
    hitPlayer(socket_id, hit_socked_id, damage_source_angle, damage = 10){
        let hit_player = this.getPlayer(hit_socked_id)
        if(hit_player.isDead()) return

        let player = this.getPlayer(socket_id)
        damage = damage + player.power
        if(hit_player.armour > 0 && hit_player.in_block && Functions.checkAngleDiffForBlock(hit_player.angle, damage_source_angle)){
            if(hit_player.move_back){
                damage -= 2
            }
            if(damage < 0) damage = 0
            hit_player.armour -= damage
            if(hit_player.armour >= 0){
                this.io.to(socket_id).emit('modal', {
                    color: 'yellow',
                    value: 'Block!'
                } )
                return
            }

            damage = hit_player.armour * -1
            hit_player.armour = 0
        }

        hit_player.hp -= damage
        if(hit_player.hp <= 0){
            hit_player.state = 4
            player.kills ++
            this.io.to(hit_socked_id).emit('dead')
            this.io.sockets.emit('update_leaderboard', this.players)
        }
        this.io.to(socket_id).emit('modal', {
            color: 'red',
            value: damage
        } )
    }

    frame(){
        let back_players = Object.values(this.players)

        for(let i = 0; i < this.arrows.length; i++){
            let arrow = this.arrows[i]
            let layout = this.map.getLayout()
            if(layout[Math.floor(arrow.y)][Math.floor(arrow.x)] !== 0){
                this.arrows = this.arrows.filter(elem => elem !== arrow)
                this.io.sockets.emit('delete_sprite', arrow.id);
            }

            for(let i = 0; i < back_players.length; i++){
                let b_player = back_players[i]

                if(b_player.socket_id ===  arrow.owner_id) continue

                if(b_player.isDead()) continue

                let hit = Math.sqrt(Math.pow(arrow.x- b_player.x, 2) + Math.pow( arrow.y - b_player.y, 2)) < 0.3
                if(hit){
                    this.io.sockets.emit('delete_sprite', arrow.id);
                    this.hitPlayer(arrow.owner_id, b_player.socket_id, arrow.angle)
                    this.arrows = this.arrows.filter(elem => elem !== arrow)
                }
            }
            arrow.x += Math.cos(Functions.degreeToRadians(arrow.angle)) * 0.3
            arrow.y += Math.sin(Functions.degreeToRadians(arrow.angle)) * 0.3
        }
        for(let i = 0; i < this.power_ups.length; i++){
            let power_up = this.power_ups[i]

            for(let i = 0; i < back_players.length; i++){

                let b_player = back_players[i]

                if(b_player.isDead()) continue

                let hit = Math.sqrt(Math.pow(power_up.x - b_player.x, 2) + Math.pow( power_up.y - b_player.y, 2)) < 0.3
                if(hit){
                    power_up.pickUp(b_player)
                    this.power_ups = this.power_ups.filter(elem => elem !== power_up)
                    this.io.sockets.to(b_player.socket_id).emit('update_spell', b_player.spell)
                    this.io.sockets.emit('delete_sprite', power_up.id);
                }
            }
        }

        for(let i = 0; i < this.spells.length; i++){
            let spell = this.spells[i]
            spell.act(this)
        }
    }
}