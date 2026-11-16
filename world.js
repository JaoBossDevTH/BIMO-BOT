const WORLD_KEY='bimo-world-economy-v1';
const CATALOG={durian:{name:'ทุเรียนหมอนทอง',emoji:'🌳',seed:120,grow:240,water:2,yield:3,sell:95},premium:{name:'ทุเรียนก้านยาว',emoji:'🌲',seed:330,grow:480,water:3,yield:4,sell:175},rubber:{name:'ยางพารา',emoji:'🌴',seed:85,grow:300,water:2,yield:2,sell:68},strawberry:{name:'สตรอว์เบอร์รี',emoji:'🍓',seed:35,grow:65,water:1,yield:4,sell:19},melon:{name:'เมลอน',emoji:'🍈',seed:65,grow:125,water:2,yield:3,sell:38}};
const GOODS={cookie:{name:'คุกกี้',emoji:'🍪',price:35,kind:'food'},pudding:{name:'พุดดิ้ง',emoji:'🍮',price:45,kind:'food'},strawberry:{name:'สตรอว์เบอร์รี',emoji:'🍓',price:25,kind:'food'},ball:{name:'ลูกบอล',emoji:'🪀',price:90,kind:'toy'},ribbon:{name:'โบว์สีชมพู',emoji:'🎀',price:120,kind:'decor'},star:{name:'โคมไฟดาว',emoji:'🌟',price:180,kind:'decor'}};
let world;try{world=JSON.parse(localStorage.getItem(WORLD_KEY))}catch{};if(!world||!Array.isArray(world.plots))world={coins:600,plots:Array.from({length:9},()=>null),inventory:{},level:1,xp:0,upgrade:0,transactions:[]};
function worldSave(){localStorage.setItem(WORLD_KEY,JSON.stringify(world))}
function money(v){return Number(v).toLocaleString('th-TH')}
function notifyWorld(msg){toast(msg);worldSave()}
function rewardWorld(amount){world.coins+=amount;worldSave()}
