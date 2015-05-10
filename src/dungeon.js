// BSP Dungeon Generation
BSP = function(val) {
    return {
        value: val,
        children: null,
        set_children: function(child1, child2) {
            this.children = [child1, child2];
        },
        print: function() {
            return (
                "[" + this.value + ": ("
                + (this.children ? this.children[0].print() : 'null')
                + ', '
                + (this.children ? this.children[1].print() : 'null')
                + ")]"
            );
        },
        get_rooms: function() {
            if(this.children === null) {
                return [this.value.space];
            }
            else {
                return this.children[0].get_rooms()
                    .concat(this.children[1].get_rooms());
            }
        },
    };
};

Dungeon = {};

(function() {
var SPREAD = 0.25;

Dungeon.make_dungeon = function(w, h) {
    // Create tree
    var tree = Dungeon.gen_tree(w,h);
    // Create rooms
    var rooms = Dungeon.gen_rooms(tree);
    // Connect rooms
    var tunnels = Dungeon.gen_tunnels(tree, 0);

    return {
        tree: tree,
        rooms: rooms,
        tunnels: tunnels,
    };
};


Dungeon.gen_tunnels = function(tree, level) {
    var tunnels = [];

    if(tree.children === null) {
        return [];
    }
    var s0 = tree.children[0].value.space;
    var s1 = tree.children[1].value.space;
    var tun = [[s0.x + Math.floor(s0.w / 2), s0.y + Math.floor(s0.h / 2)],
               [s1.x + Math.floor(s1.w / 2), s1.y + Math.floor(s1.h / 2)]];

    return [tun].concat(
        Dungeon.gen_tunnels(tree.children[0], level+1),
        Dungeon.gen_tunnels(tree.children[1], level+1)
    );
};


Dungeon.gen_rooms = function(tree) {
    var spaces = tree.get_rooms();
    var rooms = [];
    for(var i = 0; i < spaces.length; i++) {
        var vspread = Random.randint(5,30) / 100;
        var hspread = vspread;
        var room = {
            x: Math.floor(spaces[i].x + (vspread*spaces[i].w)),
            y: Math.floor(spaces[i].y + (hspread*spaces[i].h)),
            w: Math.floor(spaces[i].w * (1-2*vspread)),
            h: Math.floor(spaces[i].h * (1-2*hspread)),
        };
        rooms.push(room);
    }
    return rooms;
};


Dungeon.make_root = function(w, h) {
    var val = {
        space: {x: 0, y: 0, w: w, h: h},
    }
    var tree = BSP(val);
    return tree;
};


Dungeon.split_tree = function(tree) {
    var space = tree.value.space;
    if(space.w < 10 || space.h < 10) {
        return null;
    }
    if(space.w > space.h) {
        var dir = 'v';
    }
    else {
        var dir = 'h';
    }
    //var dir = Random.randint(0,1) ? 'v' : 'h';

    var ret = [];
    if(dir == 'v') {
        var center = Math.floor(space.w / 2);
        var spread = Math.floor(space.w * SPREAD);
        var split = Random.randint(center-spread, center+spread);
        var first  = {x: space.x, y: space.y, w: split, h: space.h}
        var second = {x: space.x+split, y: space.y,
                      w: space.w-split, h: space.h}
    }
    else if(dir == 'h') {
        var center = Math.floor(space.h / 2);
        var spread = Math.floor(space.h * SPREAD);
        var split = Random.randint(center-spread, center-spread);
        var first  = {x: space.x, y: space.y, w: space.w, h: split }
        var second = {x: space.x, y: space.y+split,
                      w: space.w, h: space.h-split}
    }
    tree.value.dir = dir;
    tree.value.split = split;
    first  = BSP({space: first});
    second = BSP({space: second});
    tree.set_children(first, second);

    return tree.children;
};


Dungeon.gen_tree = function(w, h) {
    var tree = Dungeon.make_root(w, h);
    var nodes = [tree];

    for(var i = 0; i < 4; i++) {
        var next_nodes = [];
        for(var j = 0; j < nodes.length; j++) {
            var leaves = Dungeon.split_tree(nodes[j]);
            if(leaves !== null) {
                next_nodes = next_nodes.concat(leaves);
            }
        }
        nodes = next_nodes;
    }

    return tree;
};


Dungeon.draw = function(dungeon) {
    var tree = dungeon.tree;
    var i, y;
    var width = tree.value.space.w;
    var height = tree.value.space.h;
    var canvas = $('#test1')[0];
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    var imgdata = context.createImageData(width, height);
    var spaces = tree.get_rooms();

    // Draw spaces in black
    for(var s=0; s<spaces.length; s++) {
        var space = spaces[s];
        for(var x=space.x; x<(space.x+space.w); x++) {
            y = space.y;
            // Top
            i = (y*width+x) * 4;
            imgdata.data[i+0] = 0;
            imgdata.data[i+1] = 0;
            imgdata.data[i+2] = 0;
            imgdata.data[i+3] = 255;

            // Bottom
            y = (space.y+space.h-1);
            i = (y*width+x) * 4;
            imgdata.data[i+0] = 0;
            imgdata.data[i+1] = 0;
            imgdata.data[i+2] = 0;
            imgdata.data[i+3] = 255;

            // Left/Right
            if(x == space.x || x == (space.x+space.w-1)) {
                for(y = space.y; y<(space.y+space.h); y++) {
                    i = (y*width+x) * 4;
                    imgdata.data[i+0] = 0;
                    imgdata.data[i+1] = 0;
                    imgdata.data[i+2] = 0;
                    imgdata.data[i+3] = 255;
                }
            }
        }
    }

    // Draw rooms in blue
    for(var r=0; r<dungeon.rooms.length; r++) {
        var room = dungeon.rooms[r];
        for(var x=room.x; x<(room.x+room.w); x++) {
            y = room.y;
            // Top
            i = (y*width+x) * 4;
            imgdata.data[i+0] = 0;
            imgdata.data[i+1] = 0;
            imgdata.data[i+2] = 255;
            imgdata.data[i+3] = 255;

            // Bottom
            y = (room.y+room.h-1);
            i = (y*width+x) * 4;
            imgdata.data[i+0] = 0;
            imgdata.data[i+1] = 0;
            imgdata.data[i+2] = 255;
            imgdata.data[i+3] = 255;

            // Left/Right
            if(x == room.x || x == (room.x+room.w-1)) {
                for(y = room.y; y<(room.y+room.h); y++) {
                    i = (y*width+x) * 4;
                    imgdata.data[i+0] = 0;
                    imgdata.data[i+1] = 0;
                    imgdata.data[i+2] = 255;
                    imgdata.data[i+3] = 255;
                }
            }
        }
    }
    context.putImageData(imgdata, 0, 0);

    var tunnels = dungeon.tunnels;
    for(var t = 0; t < tunnels.length; t++) {
        var tun = tunnels[t];
        context.strokeStyle = '#FF0000';
        context.moveTo(tun[0][0], tun[0][1]);
        context.lineTo(tun[1][0], tun[1][1]);
        context.stroke();
    }
};

})()