var map = L.map('map', {
    zoomSnap: 0,
    center: [37.575, 137.984],
    zoom: 5.6,
    minZoom: 4,
    preferCanvas:false,
});

let url = L.urlHandler(map); // リンク書換機能の追加
if (typeof url._zoom != 'undefined') { // 位置情報付URL
	map.setView([url._lat, url._lng], url._zoom);
}
L.control.scale({maxWidth:150,position:'bottomright',imperial:false}).addTo(map);  // スケールを表示
map.zoomControl.setPosition('topright');

map.attributionControl.addAttribution("国土交通省");
map.attributionControl.addAttribution("L.urlHandler");

map.createPane("pane_map").style.zIndex = 1;
map.createPane("markers").style.zIndex = 620;
map.createPane("saveMarkers").style.zIndex = 630;

var baseMap = {
    "Google 標準地図": L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {pane: "pane_map",}).addTo(map),
    "Google 道路地図": L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {pane: "pane_map",}),
    "Google 衛星写真": L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {pane: "pane_map",}),
    "Google 衛星+地図": L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {pane: "pane_map",}),
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "OpenStreetMap HOT": L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "気象庁 地図": L.tileLayer('https://www.data.jma.go.jp/svd/eqdb/data/shindo/map/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "国土地理院 標準地図": L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "国土地理院 白地図": L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "国土地理院 単色地図": L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "Esri World Topo Map": L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {pane: "pane_map",}),
    "MIERUNE": L.tileLayer('https://tile.mierune.co.jp/mierune/{z}/{x}/{y}@2x.png', {pane: "pane_map",}),
    "MIERUNE mono": L.tileLayer('https://tile.mierune.co.jp/mierune_mono/{z}/{x}/{y}@2x.png', {pane: "pane_map",}),
    "Stamen_Terrain": L.tileLayer('http://a.tile.stamen.com/terrain/{z}/{x}/{y}.png', {pane: "pane_map",}),
    "Stamen_Watercolor": L.tileLayer('http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg', {pane: "pane_map",})
};

L.control.layers(baseMap).addTo(map);

var markers = L.layerGroup();
var saveMarkers = L.layerGroup();
var saveMarkersList = [];

//現行json取得　都道府県選択画面付き
var prefCityList = {
    "1-2": {"prefName": "北海道道北", "cityList": [102204,102212,102214,102220,102221,102229,102452,102453,102454,102455,102456,102457,102458,102459,102460,102461,102462,102463,102464,102465,102468,102469,102470,102471,102481,102482,102483,102484,102485,102486,102487,102488,102511,102512,102513,102514,102516]},
    "1-3": {"prefName": "北海道道東", "cityList": [103206,103207,103208,103211,103219,103543,103544,103545,103546,103547,103549,103550,103552,103555,103559,103560,103561,103562,103564,103631,103632,103633,103635,103636,103637,103638,103639,103641,103643,103644,103645,103646,103647,103648,103649,103661,103662,103664,103665,103667,103668,103691,103692,103693,103694]},
    "1-4": {"prefName": "北海道道央", "cityList": [104100,104203,104209,104210,104215,104216,104217,104218,104222,104224,104225,104226,104227,104228,104231,104234,104235,104303,104304,104391,104393,104394,104395,104396,104397,104398,104399,104400,104401,104402,104403,104404,104405,104406,104407,104408,104409,104423,104424,104425,104427,104428,104429,104430,104431,104432,104433,104434,104436,104437,104438,104439]},
    "1-5": {"prefName": "北海道道南", "cityList": [105202,105205,105213,105230,105233,105236,105331,105332,105333,105334,105337,105343,105345,105346,105347,105361,105362,105363,105364,105367,105370,105371,105571,105575,105578,105581,105584,105585,105586,105601,105602,105604,105607,105608,105609,105610]},
    "2": {"prefName": "青森県", "cityList": [201201,201202,201203,201204,201205,201206,201207,201208,201209,201210,201301,201303,201304,201307,201321,201323,201343,201361,201362,201367,201381,201384,201387,201405,201408,201411,201412,201423,201424,201425,201426,201442,201443,201445]},
    "3": {"prefName": "岩手県", "cityList": [301201,301202,301203,301205,301206,301207,301208,301209,301210,301211,301213,301214,301215,301301,301302,301303,301305,301321,301322,301366,301381,301402,301441,301461,301482,301483,301484,301485,301501,301503,301506,301507]},
    "4": {"prefName": "宮城県", "cityList": [401100,401202,401205,401206,401207,401208,401209,401211,401212,401213,401214,401215,401301,401302,401322,401323,401324,401341,401361,401362,401401,401406,401421,401422,401423,401424,401445,401501,401505,401606]},
    "5": {"prefName": "秋田県", "cityList": [501201,501202,501203,501204,501207,501209,501210,501212,501213,501214,501215,501303,501327,501346,501348,501361,501434,501463]},
    "6": {"prefName": "山形県", "cityList": [601201,601202,601203,601204,601205,601206,601207,601208,601209,601210,601211,601212,601213,601301,601302,601321,601322,601323,601324,601341,601361,601362,601363,601364,601365,601366,601367,601381,601382,601401,601402,601403,601426,601428,601461]},
    "7": {"prefName": "福島県", "cityList": [701201,701202,701203,701204,701205,701207,701208,701209,701210,701211,701212,701213,701301,701303,701308,701322,701323,701342,701344,701362,701364,701367,701368,701402,701405,701407,701408,701421,701422,701423,701444,701445,701446,701447,701461,701464,701465,701466,701481,701482,701483,701484,701501,701502,701504,701521,701522,701543,701547,701561,701564]},
    "8": {"prefName": "茨城県", "cityList": [801201,801202,801203,801204,801205,801207,801208,801210,801211,801212,801214,801215,801216,801217,801219,801220,801221,801222,801223,801224,801225,801226,801227,801228,801229,801230,801231,801232,801233,801234,801235,801236,801302,801309,801310,801341,801364,801442,801443,801447,801521,801542,801546,801564]},
    "9": {"prefName": "栃木県", "cityList": [901201,901202,901203,901204,901205,901206,901208,901209,901210,901211,901213,901214,901215,901216,901301,901342,901343,901344,901345,901361,901364,901384,901386,901407,901411]},
    "10": {"prefName": "群馬県", "cityList": [1001201,1001202,1001203,1001204,1001205,1001206,1001207,1001208,1001209,1001210,1001211,1001212,1001344,1001345,1001366,1001367,1001382,1001383,1001384,1001421,1001424,1001425,1001426,1001428,1001443,1001444,1001448,1001449,1001464,1001521,1001522,1001523,1001524,1001525]},
    "11": {"prefName": "埼玉県", "cityList": [1101100,1101201,1101202,1101203,1101206,1101207,1101208,1101209,1101210,1101211,1101212,1101214,1101215,1101216,1101217,1101218,1101219,1101221,1101222,1101224,1101225,1101227,1101228,1101229,1101230,1101231,1101232,1101234,1101235,1101237,1101238,1101239,1101240,1101243,1101326,1101327,1101343,1101346,1101347,1101348,1101349,1101362,1101383,1101385,1101408,1101442,1101445,1101464,1101465]},
    "12": {"prefName": "千葉県", "cityList": [1201100,1201202,1201203,1201204,1201205,1201206,1201207,1201208,1201210,1201211,1201212,1201215,1201217,1201219,1201220,1201222,1201223,1201225,1201226,1201229,1201231,1201234,1201236,1201237,1201238,1201329,1201342,1201347,1201349,1201402,1201403,1201410,1201421,1201422,1201424,1201426,1201427,1201441,1201463]},
    "13": {"prefName": "東京都", "cityList": [1301103,1301105,1301109,1301110,1301111,1301112,1301113,1301114,1301115,1301117,1301119,1301120,1301121,1301122,1301123,1301201,1301202,1301204,1301205,1301206,1301207,1301208,1301209,1301212,1301215,1301218,1301219,1301224,1301227,1301228,1301229]},
    "14": {"prefName": "神奈川県", "cityList": [1401100,1401130,1401201,1401203,1401205,1401206,1401207,1401208,1401209,1401211,1401212,1401213,1401214,1401215,1401216,1401217,1401301,1401321,1401341,1401342,1401361,1401362,1401363,1401364,1401366,1401384,1401401,1401402]},
    "15": {"prefName": "新潟県", "cityList": [1501201,1501202,1501204,1501205,1501206,1501208,1501209,1501210,1501211,1501212,1501213,1501216,1501217,1501218,1501222,1501223,1501224,1501225,1501226,1501227,1501361,1501385,1501482,1501504,1501581]},
    "16": {"prefName": "富山県", "cityList": [1601201,1601202,1601204,1601205,1601206,1601207,1601208,1601209,1601210,1601211,1601322,1601323,1601342,1601343]},
    "17": {"prefName": "石川県", "cityList": [1701201,1701202,1701203,1701204,1701205,1701206,1701207,1701209,1701210,1701211,1701324,1701344,1701361,1701365,1701384,1701386,1701407,1701461,1701463]},
    "18": {"prefName": "福井県", "cityList": [1801201,1801204,1801210,1801322,1801501]},
    "19": {"prefName": "山梨県", "cityList": [1901201,1901202,1901204,1901205,1901206,1901207,1901208,1901209,1901210,1901211,1901212,1901213,1901214,1901346,1901361,1901365,1901366,1901384,1901422,1901424,1901442,1901443]},
    "20": {"prefName": "長野県", "cityList": [2001201,2001202,2001203,2001204,2001205,2001206,2001207,2001208,2001209,2001210,2001211,2001212,2001213,2001214,2001215,2001217,2001218,2001219,2001220,2001303,2001304,2001305,2001306,2001307,2001309,2001321,2001323,2001324,2001349,2001350,2001361,2001382,2001383,2001384,2001385,2001386,2001388,2001402,2001403,2001404,2001407,2001409,2001410,2001411,2001412,2001413,2001414,2001415,2001416,2001417,2001422,2001423,2001429,2001430,2001432,2001446,2001448,2001450,2001451,2001452,2001482,2001485,2001486,2001521,2001541,2001561,2001562,2001583,2001590,2001602]},
    "21": {"prefName": "岐阜県", "cityList": [2101201,2101202,2101203,2101204,2101205,2101206,2101207,2101208,2101209,2101210,2101211,2101212,2101213,2101214,2101215,2101216,2101217,2101218,2101219,2101220,2101221,2101303,2101341,2101361,2101381,2101382,2101383,2101401,2101403,2101404,2101421,2101501,2101503,2101504,2101505,2101521,2101604]},
    "22": {"prefName": "静岡県", "cityList": [2201100,2201202,2201203,2201206,2201207,2201209,2201210,2201211,2201212,2201213,2201214,2201222,2201224,2201225,2201325,2201341,2201429]},
    "23": {"prefName": "愛知県", "cityList": [2301100,2301201,2301202,2301203,2301205,2301206,2301207,2301209,2301211,2301212,2301213,2301215,2301216,2301217,2301220,2301221,2301223,2301225,2301228,2301232,2301233,2301235,2301362,2301441,2301562,2301563]},
    "24": {"prefName": "三重県", "cityList": [2401201,2401202,2401203,2401204,2401205,2401207,2401208,2401209,2401210,2401211,2401212,2401214,2401215,2401216,2401324,2401341,2401343,2401344,2401441,2401442,2401461,2401470,2401471,2401543,2401562]},
    "25": {"prefName": "滋賀県", "cityList": [2501201,2501202,2501203,2501204,2501206,2501207,2501208,2501209,2501210,2501211,2501212,2501213,2501214,2501383,2501384,2501425,2501442,2501443]},
    "26": {"prefName": "京都府", "cityList": [2601100,2601201,2601202,2601203,2601204,2601205,2601206,2601207,2601209,2601210,2601211,2601212,2601213,2601303,2601322,2601344,2601362,2601364,2601365,2601366,2601367,2601465]},
    "27": {"prefName": "大阪府", "cityList": [2701100,2701200,2701202,2701203,2701204,2701205,2701206,2701207,2701208,2701209,2701210,2701211,2701212,2701213,2701214,2701215,2701216,2701217,2701218,2701219,2701220,2701221,2701222,2701223,2701224,2701225,2701226,2701227,2701228,2701231,2701232,2701301,2701321,2701322,2701341,2701361,2701366,2701381,2701382]},
    "28": {"prefName": "兵庫県", "cityList": [2801100,2801201,2801202,2801203,2801204,2801205,2801206,2801207,2801208,2801209,2801210,2801212,2801213,2801214,2801215,2801216,2801217,2801218,2801219,2801220,2801221,2801222,2801223,2801224,2801225,2801226,2801227,2801228,2801229,2801301,2801365,2801381,2801382,2801442,2801443,2801446,2801464,2801481,2801501,2801585,2801586]},
    "29": {"prefName": "奈良県", "cityList": [2901201,2901202,2901203,2901204,2901205,2901206,2901207,2901208,2901209,2901210,2901212,2901322,2901343,2901344,2901345,2901361,2901362,2901363,2901385,2901386,2901402,2901424,2901425,2901426,2901427,2901441,2901442,2901443,2901446,2901449,2901451,2901452,2901453]},
    "30": {"prefName": "和歌山県", "cityList": [3001201,3001203,3001207,3001208,3001209,3001341,3001343]},
    "31": {"prefName": "鳥取県", "cityList": [3101201,3101202,3101203,3101204,3101364,3101372,3101384,3101386,3101389,3101390,3101402,3101403]},
    "32": {"prefName": "島根県", "cityList": [3201201,3201203,3201204,3201206,3201207,3201209,3201386,3201441,3201448,3201449]},
    "33": {"prefName": "岡山県", "cityList": [3301201,3301202,3301203,3301204,3301205,3301207,3301208,3301209,3301210,3301211,3301212,3301213,3301214,3301215,3301216,3301346,3301423,3301445,3301461,3301586,3301606,3301622,3301623,3301643,3301663,3301666,3301681]},
    "34": {"prefName": "広島県", "cityList": [3401100,3401202,3401203,3401204,3401205,3401207,3401208,3401209,3401210,3401211,3401212,3401213,3401214,3401215,3401302,3401304,3401309,3401368,3401369,3401431,3401545]},
    "35": {"prefName": "山口県", "cityList": [3501203,3501206,3501208,3501321]},
    "36": {"prefName": "徳島県", "cityList": [3601201,3601202,3601204,3601205,3601206,3601207,3601208,3601341,3601401,3601402,3601404,3601405,3601468,3601489]},
    "37": {"prefName": "香川県", "cityList": [3701201,3701202,3701203,3701204,3701205,3701206,3701207,3701208,3701341,3701387,3701404,3701406]},
    "38": {"prefName": "愛媛県", "cityList": [3801201,3801202,3801203,3801204,3801205,3801206,3801207,3801210,3801213,3801214,3801215,3801386,3801401,3801402,3801422,3801484,3801488,3801506]},
    "39": {"prefName": "高知県", "cityList": [3901201,3901202,3901203,3901204,3901205,3901206,3901209,3901210,3901211,3901212,3901302,3901303,3901304,3901307,3901341,3901363,3901386,3901402,3901403,3901405,3901410,3901411,3901412,3901424,3901427,3901428]},
    "40": {"prefName": "福岡県", "cityList": [4001100,4001130,4001202,4001203,4001204,4001205,4001206,4001207,4001210,4001211,4001212,4001213,4001215,4001216,4001217,4001219,4001220,4001224,4001225,4001226,4001227,4001228,4001343,4001349,4001382,4001503,4001561,4001602,4001610,4001642,4001646]},
    "41": {"prefName": "佐賀県", "cityList": [4101201,4101202,4101203,4101204,4101205,4101206,4101207,4101208,4101209,4101210,4101327,4101341,4101346,4101401,4101423,4101424,4101425]},
    "42": {"prefName": "長崎県", "cityList": [4201201,4201202,4201203,4201204,4201205,4201207,4201208,4201209,4201210,4201211,4201212,4201213,4201214,4201307,4201308,4201321,4201322,4201323,4201391,4201411]},
    "43": {"prefName": "熊本県", "cityList": [4301201,4301202,4301203,4301204,4301205,4301206,4301208,4301210,4301211,4301212,4301213,4301214,4301215,4301348,4301364,4301367,4301368,4301369,4301403,4301404,4301423,4301424,4301432,4301433,4301441,4301442,4301443,4301444,4301447,4301468,4301482,4301484,4301501,4301505,4301506,4301507,4301510,4301511,4301512,4301513,4301514,4301531]},
    "44": {"prefName": "大分県", "cityList": [4401201,4401202,4401203,4401204,4401205,4401206,4401207,4401208,4401209,4401210,4401211,4401212,4401213,4401214,4401341,4401461,4401462]},
    "45": {"prefName": "宮崎県", "cityList": [4501201,4501202,4501203,4501204,4501205,4501206,4501207,4501208,4501209,4501341,4501382,4501383,4501401,4501402,4501403,4501421,4501429,4501442,4501443]},
    "46": {"prefName": "鹿児島県", "cityList": [4601201,4601203,4601208,4601209,4601215,4601216,4601218,4601220,4601323,4601392,4601452,4601482,4601492]}
}
const regions = {
    '北海道地方': ['1-2', '1-3', '1-4', '1-5'],
    '東北地方': ['2', '3', '4', '5', '6', '7'],
    '関東地方': ['8', '9', '10', '11', '12', '13', '14'],
    '中部地方': ['15', '16', '17', '18', '19', '20', '21', '22', '23', '24'],
    '近畿地方': ['25', '26', '27', '28', '29', '30'],
    '中国・四国地方': ['31', '32', '33', '34', '35', '36', '37', '38', '39'],
    '九州地方': ['40', '41', '42', '43', '44', '45', '46']
};

var prefCheckList = [];
var slideshowList;
if (localStorage.getItem('slideshowList') != undefined) {
    slideshowList = JSON.parse(localStorage.getItem('slideshowList'));
} else {
    slideshowList = {};
}
var pointLatLngList = {};

const prefCityArray = Object.keys(prefCityList).map(key => ({
    key: key,
    prefName: prefCityList[key].prefName
}));

prefCityArray.sort((a, b) => {
    const partsA = a.key.split('-').map(part => parseInt(part));
    const partsB = b.key.split('-').map(part => parseInt(part));

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;

        if (numA < numB) return -1;
        if (numA > numB) return 1;
    }

    return 0;
});

var prefselect = document.getElementById('prefselect');
var front_div_prefselect = document.getElementById('front_div_prefselect');
front_div_prefselect.innerHTML = '';
var titleDiv = document.createElement('div');
titleDiv.className = 'front_div_prefselect_titleDiv';
var titleSpan = document.createElement('span');
titleSpan.style.fontSize = '1.4rem';
titleSpan.textContent = '都道府県選択';
titleDiv.appendChild(titleSpan);
front_div_prefselect.appendChild(titleDiv);
var html_checkboxList = "";
// 地方ごとにチェックボックスを生成
for (const regionName in regions) {
    const regionDiv = document.createElement('div');
    const regionTitle = document.createElement('div');
    regionTitle.className = 'front_div_prefselect_regionDiv';
    regionTitle.textContent = regionName;
    regionDiv.appendChild(regionTitle);

    const checkboxContainer = document.createElement('div'); // チェックボックスをまとめるコンテナ
    checkboxContainer.className = 'front_div_prefselect_checkboxDiv';
    regions[regionName].forEach(key => {
        const pref = prefCityList[key];
        if (pref) {
            const text = '[' + key + '] ' + pref.prefName;

            const checkboxDOM = document.createElement('md-checkbox');
            checkboxDOM.name = 'prefselectcheckbox';
            checkboxDOM.dataset.value = key;
            checkboxDOM.id = 'prefselectcheckbox_' + key;

            const labelDOM = document.createElement('label');
            labelDOM.textContent = text;
            labelDOM.htmlFor = 'prefselectcheckbox_' + key;

            const checkboxWrapper = document.createElement('span'); // spanに変更
            checkboxWrapper.appendChild(checkboxDOM);
            checkboxWrapper.appendChild(labelDOM);

            checkboxContainer.appendChild(checkboxWrapper); // コンテナに追加
        }
    });
    regionDiv.appendChild(checkboxContainer); // コンテナを地方のdivに追加
    front_div_prefselect.appendChild(regionDiv);
}

var buttonDiv = document.createElement('div');
buttonDiv.className = 'front_div_prefselect_titleDiv';
var cancelButton = document.createElement('span');
cancelButton.id = 'cancel_front_div_prefselect';
cancelButton.textContent = 'キャンセル';
buttonDiv.appendChild(cancelButton);
var okButton = document.createElement('span');
okButton.id = 'ok_front_div_prefselect';
okButton.textContent = '適用';
buttonDiv.appendChild(okButton);
front_div_prefselect.appendChild(buttonDiv);

document.getElementById('ok_front_div_prefselect').addEventListener("click",()=>{
    prefCheckList = [];
    $('md-checkbox[name=prefselectcheckbox]').each(function() {
        const shadowRoot = $(this)[0].shadowRoot;
        var v = $(this)[0].dataset.value;
        if (shadowRoot) {
            $(shadowRoot).find('input:checked').each(function() {
                prefCheckList.push(v);
            });
        }
    });
    $('#div_prefselect').removeClass('display');
    $('#modal_back').removeClass('display');
    drawMap(prefCheckList);
});
$('#cancel_front_div_prefselect').click(e => {
    $('#div_prefselect').removeClass('display');
    $('#modal_back').removeClass('display');
});
$('#prefselect').click(e => {
    $('#div_prefselect').addClass('display');
    $('#modal_back').addClass('display');
});

loadSaveMarkers();
function loadSaveMarkers() {
    map.removeLayer(saveMarkers);
    saveMarkers = L.layerGroup();
    saveMarkersList = [];
    var loadSaveList = JSON.parse(localStorage.getItem('slideshowList'));
    if (loadSaveList != undefined) {
        Object.keys(loadSaveList).forEach(element => {
            saveMarkersList.push(element);
            var latlon = new L.LatLng(loadSaveList[element]["lat"], loadSaveList[element]["lng"]);
            var camName = loadSaveList[element]["name"];
            var prefCode = loadSaveList[element]["prefCode"];
            let locationRedIcon = L.icon({
                iconUrl: 'source/location_red.svg',
                iconSize: [30.8, 40],
                iconAnchor: [15.4, 40],
                shadowUrl: 'source/marker_shadow.png',
                shadowSize: [35, 40],
                shadowAnchor: [6, 41],
                tooltipAnchor: [15.4, -20]
            });
            var id = element;
            $.getJSON("camera.php?url="+id, function(data) {
                slideshowList[id]["imageSrc"] = data["obsInfo"]["currProvUrl"];
                var kariSaveMarker = L.marker(latlon, {icon: locationRedIcon, pane: "saveMarkers"}).bindTooltip(camName);
                kariSaveMarker.imageURL = data["obsInfo"]["currProvUrl"];
                kariSaveMarker.camName = camName;
                kariSaveMarker.camID = id;
                kariSaveMarker.prefCode = prefCode;
                kariSaveMarker.lat = loadSaveList[element]["lat"];
                kariSaveMarker.lng = loadSaveList[element]["lng"];
                kariSaveMarker.on('click', function(e) { viewPhoto(e)});
                saveMarkers.addLayer(kariSaveMarker);
            });
        });
        map.addLayer(saveMarkers);
        localStorage.setItem('slideshowList', JSON.stringify(slideshowList));
    }
}

function drawMap(prefCode) {
    if (prefCode == undefined || prefCode == "undefined") {
    } else {
        map.removeLayer(markers);
        markers = L.layerGroup();

        pointLatLngList = {};

        prefCode.forEach(PC => {
            prefCityList[PC]["cityList"].forEach(uRl => {
                $.getJSON("normal.php?url="+uRl, function(data) {
                    data["features"].forEach(element => {
                        var id = element["properties"]["id"];
                        if (saveMarkersList.includes(id) == false) {
                            var latlon = new L.LatLng(element["geometry"]["coordinates"][1], element["geometry"]["coordinates"][0]);
                            var name = element["properties"]["name"];
                            pointLatLngList[id] = {};
                            pointLatLngList[id]["name"] = name;
                            pointLatLngList[id]["prefCode"] = PC;
                            pointLatLngList[id]["lat"] = element["geometry"]["coordinates"][1];
                            pointLatLngList[id]["lng"] = element["geometry"]["coordinates"][0];
                            $.getJSON("camera.php?url="+id, function(data) {
                                var imageSrc = data["obsInfo"]["currProvUrl"];
                                pointLatLngList[id]["imageSrc"] = imageSrc;
                                let locationBlueIcon = L.icon({
                                    iconUrl: 'source/location_blue.svg',
                                    iconSize: [30.8, 40],
                                    iconAnchor: [15.4, 40],
                                    shadowUrl: 'source/marker_shadow.png',
                                    shadowSize: [35, 40],
                                    shadowAnchor: [6, 41],
                                    tooltipAnchor: [15.4, -20]
                                });
                                var kariMarker = L.marker(latlon, {icon: locationBlueIcon, pane: "markers"}).bindTooltip(name);
                                kariMarker.imageURL = imageSrc;
                                kariMarker.camName = name;
                                kariMarker.camID = id;
                                kariMarker.prefCode = PC;
                                kariMarker.lat = pointLatLngList[id]["lat"];
                                kariMarker.lng = pointLatLngList[id]["lng"];
                                kariMarker.on('click', function(e) { viewPhoto(e)});
                                markers.addLayer(kariMarker);
                            });
                        }
                    });
                });
            });
        });
        
        map.addLayer(markers);
    }
    loadSaveMarkers();
}

function viewPhoto(e) {
    var imageSrc = e.target.imageURL;
    var name = e.target.camName;
    var camID = e.target.camID;
    var prefCode = e.target.prefCode;
    var lat = e.target.lat;
    var lng = e.target.lng;
    document.getElementById('photoModal_photo_name').innerText = name;
    document.getElementById('photoModal_photo_img').src = imageSrc;
    var addChecked;
    if (slideshowList[camID]) {addChecked = "checked";} else {addChecked = "";}
    // document.getElementById('slideshow_select_label').innerHTML = '<input type="checkbox" id="slideshow_select_checkbox" onchange="slideshow_checkbox(this)" data-camid="'+camID+'" data-camname="'+name+'" data-prefcode="'+prefCode+'" '+addChecked+'>ｽﾗｲﾄﾞｼｮｰ保存';
    document.getElementById('slideshow_select_label').innerHTML = '<md-checkbox id="slideshow_select_checkbox" onchange="slideshow_checkbox(this)" data-camid="'+camID+'" data-camname="'+name+'" data-prefcode="'+prefCode+'" data-lat="'+lat+'" data-lng="'+lng+'" data-imagesrc="'+imageSrc+'" '+addChecked+'></md-checkbox>ｽﾗｲﾄﾞｼｮｰ保存';
    $('#photoModal').addClass('display');
    $('#modal_back').addClass('display');
}

document.getElementById('close_photoModal').addEventListener("click",()=>{
    $('#photoModal').removeClass('display');
    $('#modal_back').removeClass('display');
});

function slideshow_checkbox(e) {
    var camID = e.dataset.camid;
    if (e.checked) {
        slideshowList[camID] = {};
        slideshowList[camID]["name"] = e.dataset.camname;
        slideshowList[camID]["prefCode"] = e.dataset.prefcode;
        slideshowList[camID]["lat"] = e.dataset.lat;
        slideshowList[camID]["lng"] = e.dataset.lng;
        slideshowList[camID]["imageSrc"] = e.dataset.imagesrc;
    } else {
        if (slideshowList[camID]) {
            delete slideshowList[camID];
        }
    }
    localStorage.setItem('slideshowList', JSON.stringify(slideshowList));
}
var front_div_slideshow_edit = document.getElementById('front_div_slideshow_edit');
document.getElementById('slideshow_edit_btn').addEventListener("click",()=>{
    front_div_slideshow_edit.innerHTML = '<div><span style="font-size: 1.4rem;">スライドショーリスト編集</span></div>';
    front_div_slideshow_edit.innerHTML += '<div>「チェックボックス」クリックで観測点をリストから削除<br>「チェックボックス横の観測点名」クリックでその観測点へ地図遷移</div>';
    Object.keys(slideshowList).forEach(element => {
        var text = '['+slideshowList[element]["prefCode"]+', '+element+'] '+slideshowList[element]["name"];
        var htmlOB = '<span class="span_slideshow_select_checkbox"><md-checkbox name="slideshowselectcheckbox" onchange="slideshow_checkbox(this)" data-camid="'+element+'" data-camname="'+slideshowList[element]["name"]+'" data-prefcode="'+slideshowList[element]["prefCode"]+'" data-lat="'+slideshowList[element]["lat"]+'" data-lng="'+slideshowList[element]["lng"]+'" data-imagesrc="'+slideshowList[element]["imageSrc"]+'" checked></md-checkbox><span onclick="slideshow_edit(\''+element+'\')">'+text+'</span></span>';
        front_div_slideshow_edit.innerHTML += htmlOB;
    });
    $('#div_slideshow_edit').addClass('display');
    $('#modal_back').addClass('display');
});
document.getElementById('close_div_slideshow_edit').addEventListener("click",()=>{
    $('#div_slideshow_edit').removeClass('display');
    $('#modal_back').removeClass('display');
});
function slideshow_edit(camID) {
    $('#div_slideshow_edit').removeClass('display');
    $('#modal_back').removeClass('display');
    var fly_point_lnglat = new L.LatLng(slideshowList[camID]["lat"], slideshowList[camID]["lng"]);
    map.flyTo(fly_point_lnglat, 14, { duration: 0.5 });
}
document.getElementById('slideshow_select_label').addEventListener("click",(event)=>{
    event.preventDefault();
    document.getElementById('slideshow_select_checkbox').checked = !document.getElementById('slideshow_select_checkbox').checked;
    slideshow_checkbox(document.getElementById('slideshow_select_checkbox'));
});


var currentGnssMarker; // 現在のマーカーを保持する変数
// 現在地取得とマーカー描画の関数
async function getCurrentLocationAndDrawMarker() {
    // 既存のマーカーがあれば削除
    if (currentGnssMarker) {
        map.removeLayer(currentGnssMarker);
    }
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var accuracy = position.coords.accuracy;
            var gnssLatlng = L.latLng(lat, lng);

            // GNSSではない、デバイスの磁気センサーから方角取得
            var direction;
            var directionText;
            getOrientationYaw()
                .then(orientationData => {
                    console.log(orientationData);
                    if (orientationData.directionNum != null) {
                        direction = orientationData.directionNum;
                        directionText = orientationData.directionText;
                        
                        //alert(`方角：${directionText}, ${direction.toFixed(2)}°, 精度：${orientationData.accuracy}`);
                    } else {
                        direction = null;
                        directionText = null;
                        alert(orientationData.directionText);
                    }
                    drawGnssMarker();
                })
                .catch(error => {
                    direction = null;
                    directionText = null;
                    alert(error);
                    drawGnssMarker();
                });

            function drawGnssMarker() {
                var gnssMarkerStyle;
                console.log(direction);
                if (direction != null) {
                    gnssMarkerStyle = L.icon({
                        iconUrl: 'source/gnss_direction.svg', // アイコン画像のパス
                        iconSize: [80, 80], // アイコンのサイズ [幅, 高さ]
                        iconAnchor: [40, 40], // アイコンの「先端」の位置（マーカーの座標と一致させる部分）
                        popupAnchor: [0, -80] // ポップアップが表示される位置のオフセット
                    });
                    // 新しいマーカーを追加
                    currentGnssMarker = L.marker(gnssLatlng, {icon: gnssMarkerStyle, rotationAngle: direction}).addTo(map);
                    currentGnssMarker.bindPopup(`緯度：${lat.toFixed(5)}<br>経度：${lng.toFixed(5)}<br>精度：±${accuracy.toFixed(2)}m<br>方角：${directionText}, ${direction.toFixed(2)}°`);
                } else {
                    gnssMarkerStyle = L.icon({
                        iconUrl: 'source/gnss_nodirection.svg', // アイコン画像のパス
                        iconSize: [80, 80], // アイコンのサイズ [幅, 高さ]
                        iconAnchor: [40, 40], // アイコンの「先端」の位置（マーカーの座標と一致させる部分）
                        popupAnchor: [0, -80] // ポップアップが表示される位置のオフセット
                    });
                    // 新しいマーカーを追加
                    currentGnssMarker = L.marker(gnssLatlng, {icon: gnssMarkerStyle}).addTo(map);
                    currentGnssMarker.bindPopup(`緯度：${lat.toFixed(5)}<br>経度：${lng.toFixed(5)}<br>精度：±${accuracy.toFixed(2)}m<br>方角：取得不可`);
                }

                // 地図を現在地に移動
                map.setView(gnssLatlng, 15); // 現在地を中心にズームレベル15に設定

                console.log("現在地: 緯度 " + lat + ", 経度 " + lng);
                $('#gnssLoading').removeClass('display');
            }
        }, function(error) {
            var errorJP;
            if (error.message == `User denied Geolocation` || error.message == `Permission denied`) {
                errorJP = `位置情報利用許可の取得に失敗したため現在地を表示できません。\nブラウザの位置情報利用の許可ダイアログで「許可する」を選択してください。`;
            } else if (error.message == `Timeout expired`) {
                errorJP = `一定時間内に位置情報を取得できなかったため現在地を表示できません。\nGNSS衛星からの電波がよく届くところ（屋外の開けているところなど）でもう一度現在地を取得してください。`
            } else if (error.message == `Location acquisition failed`) {
                errorJP = `デバイスの問題により位置情報を取得できなかったため現在地を表示できません。\nデバイスの位置情報設定がオンになっているかや、デバイスの位置情報システムが正しく動作しているかを確認してください。`;
            } else {
                errorJP = `現在地を表示できません。\nエラーメッセージ：${error.message}`;
            }
            console.error(error.message+`\n`+errorJP);
            alert(errorJP);
        }, {
            enableHighAccuracy: true, // 高精度な位置情報を要求
            timeout: 10000,           // タイムアウト (10秒)
            maximumAge: 0             // キャッシュされた位置情報を使わない
        });
    } else {
        alert("お使いのブラウザはGeolocation APIをサポートしていません。");
    }
}

// #gnss_reload_btnがクリックされた時の処理
$("#gnss_reload_btn").on("click", async function() {
    await $('#gnssLoading').addClass('display');
    getCurrentLocationAndDrawMarker();
});

/**
 * AbsoluteOrientationSensor を使用して現在のヨー角 (方角) を一度だけ取得し、
 * その数値と対応する方角テキスト、およびセンサーの精度をオブジェクトで返します。
 * Three.js を使用して、デバイスの姿勢に関わらず水平面上の正しい方角を計算します。
 * 成功した場合は {directionNum: number, directionText: string, accuracy: number, isError: false} を解決するPromiseを返します。
 * 失敗した場合でもPromiseは解決されますが、エラー情報を含むオブジェクト
 * {directionNum: null, directionText: string, accuracy: null, isError: true} が返されます。
 */
function getOrientationYaw() {
    return new Promise((resolve) => { // rejectではなくresolveのみを使用
        // AbsoluteOrientationSensor がブラウザでサポートされているか確認
        if (!window.AbsoluteOrientationSensor) {
            resolve({ directionNum: null, directionText: 'エラー: ブラウザがセンサーをサポートしていません。', accuracy: null, isError: true });
            return;
        }
        // Three.js がロードされているか確認
        if (typeof THREE === 'undefined') {
            resolve({ directionNum: null, directionText: 'エラー: Three.js ライブラリがロードされていません。', accuracy: null, isError: true });
            return;
        }

        // 必要なセンサー権限の確認
        Promise.all([
            navigator.permissions.query({ name: "accelerometer" }),
            navigator.permissions.query({ name: "magnetometer" }),
            navigator.permissions.query({ name: "gyroscope" }),
        ]).then((results) => {
            // 全てのセンサー権限が 'granted' (許可) または 'prompt' (尋ねる) の状態かを確認
            const allGranted = results.every(
                (result) => result.state === "granted" || result.state === "prompt"
            );

            if (!allGranted) {
                resolve({ directionNum: null, directionText: "エラー: センサーへのアクセスが許可されていません。", accuracy: null, isError: true });
                return;
            }

            // AbsoluteOrientationSensor のインスタンスを作成
            const sensor = new AbsoluteOrientationSensor({ frequency: 60 });

            let timeoutId; // タイムアウトIDを保持する変数

            // センサーが読み取り可能になったら (データが利用可能になったら)
            sensor.onreading = () => {
                // タイムアウトが設定されている場合はクリア
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                const quaternionArray = sensor.quaternion;
                // クォータニオンデータが存在しない場合は処理を中断
                if (!quaternionArray) {
                    console.warn('クォータニオンデータがまだ利用できません。');
                    return; // データがまだない場合は次の読み取りを待つ
                }

                // Debug: 生のクォータニオンデータを出力
                console.log('Raw Quaternion:', quaternionArray);
                // Debug: センサーの精度を出力
                console.log('Sensor Accuracy:', sensor.accuracy);


                // Three.js の Quaternion オブジェクトを作成
                // AbsoluteOrientationSensor のクォータニオンは [x, y, z, w] の順
                const q = new THREE.Quaternion(
                    quaternionArray[0],
                    quaternionArray[1],
                    quaternionArray[2],
                    quaternionArray[3]
                );

                // デバイスの「前方」方向を表すローカルベクトルを定義
                // マップアプリのコンパスのように、デバイスの画面の「上端」が指す水平方向を方角としたい場合、
                // デバイスのローカルY軸 (0, 1, 0) を使用します。
                // これにより、デバイスをどのように傾けても、その「上端」が指す水平方向の角度が得られます。
                const forwardVector = new THREE.Vector3(0, 1, 0); // デバイスのローカルY軸 (画面の縦方向)

                // クォータニオンを使ってこのベクトルを世界座標系に変換
                // この forwardVector は、デバイスのローカルY軸が世界座標系のどこを指しているかを示します。
                forwardVector.applyQuaternion(q);

                // Debug: 変換後の前方ベクトルを出力
                console.log('Transformed Forward Vector (World Coords):', forwardVector.x.toFixed(4), forwardVector.y.toFixed(4), forwardVector.z.toFixed(4));


                // 水平面上でのヨー角を計算
                // Three.js のデフォルト座標系: Yが上、Zが前方(北)、Xが右(東)
                // atan2(x, z) は、Z軸正方向を0度とし、X軸正方向へ時計回りに角度を計算します。
                // これが、デバイスの姿勢に関わらず水平面上の正しい方角となります。
                const yawRad = Math.atan2(forwardVector.x, forwardVector.z);

                let yawDeg = yawRad * (180 / Math.PI); // ラジアンを度数に変換
                yawDeg = (yawDeg + 360) % 360; // 0-360度の範囲に調整

                // Debug: 計算されたヨー角を出力
                console.log('Calculated Yaw (Degrees):', yawDeg.toFixed(2));

                // ヨー角から方角のテキストを生成
                let directionText = '';
                if (yawDeg >= 337.5 || yawDeg < 22.5) {
                    directionText = '北 (North)';
                } else if (yawDeg >= 22.5 && yawDeg < 67.5) {
                    directionText = '北東 (Northeast)';
                } else if (yawDeg >= 67.5 && yawDeg < 112.5) {
                    directionText = '東 (East)';
                } else if (yawDeg >= 112.5 && yawDeg < 157.5) {
                    directionText = '南東 (Southeast)';
                } else if (yawDeg >= 157.5 && yawDeg < 202.5) {
                    directionText = '南 (South)';
                } else if (yawDeg >= 202.5 && yawDeg < 247.5) {
                    directionText = '南西 (Southwest)';
                } else if (yawDeg >= 247.5 && yawDeg < 292.5) {
                    directionText = '西 (West)';
                } else if (yawDeg >= 292.5 && yawDeg < 337.5) {
                    directionText = '北西 (Northwest)';
                }

                // センサーを停止し、リソースを解放
                sensor.stop();
                sensor.onreading = null; // イベントリスナーを解除
                sensor.onerror = null;

                // ヨー角の数値と方角テキスト、精度を含むオブジェクトを解決してPromiseを完了
                resolve({ directionNum: yawDeg, directionText: directionText, accuracy: sensor.accuracy, isError: false });
            };

            // センサーエラー発生時
            sensor.onerror = (event) => {
                // タイムアウトが設定されている場合はクリア
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                // センサーがアクティブな場合は停止
                if (sensor.state === 'activated') {
                    sensor.stop();
                }
                sensor.onreading = null; // イベントリスナーを解除
                sensor.onerror = null;
                // エラーメッセージとともにPromiseを解決（rejectではない）
                resolve({ directionNum: null, directionText: `エラー: ${event.error.name} - ${event.error.message}`, accuracy: null, isError: true });
            };

            // センサーを開始
            try {
                sensor.start();
                console.log('AbsoluteOrientationSensor を開始しました...');

                // 一定時間内にデータが取得できない場合のタイムアウト処理
                // センサーが応答しない場合や、ユーザーが許可を求められたが応答しない場合などに対応
                timeoutId = setTimeout(() => {
                    if (sensor.state === 'activated') {
                        sensor.stop();
                    }
                    sensor.onreading = null;
                    sensor.onerror = null;
                    // タイムアウトエラーとしてPromiseを解決（rejectではない）
                    resolve({ directionNum: null, directionText: 'エラー: センサーデータが時間内に取得できませんでした。', accuracy: null, isError: true });
                }, 5000); // 5秒のタイムアウトを設定

            } catch (error) {
                // sensor.start() 自体が失敗した場合（例: 権限がない状態で無理やり開始しようとした場合など）
                // エラーとしてPromiseを解決（rejectではない）
                resolve({ directionNum: null, directionText: `エラー: センサーの開始に失敗しました: ${error.message}`, accuracy: null, isError: true });
            }

        }).catch((error) => {
            // 権限確認のPromiseがRejectされた場合
            // エラーとしてPromiseを解決（rejectではない）
            resolve({ directionNum: null, directionText: `エラー: センサー権限の確認中にエラーが発生しました: ${error.message}`, accuracy: null, isError: true });
        });
    });
}

// function getOrientationYaw() {
//     return new Promise((resolve, reject) => {
//         // AbsoluteOrientationSensor がブラウザでサポートされているか確認
//         if (!window.AbsoluteOrientationSensor) {
//             reject(new Error('お使いのブラウザは AbsoluteOrientationSensor をサポートしていません。'));
//             return;
//         }

//         // 必要なセンサー権限の確認
//         Promise.all([
//             navigator.permissions.query({ name: "accelerometer" }),
//             navigator.permissions.query({ name: "magnetometer" }),
//             navigator.permissions.query({ name: "gyroscope" }),
//         ]).then((results) => {
//             // 全てのセンサー権限が 'granted' (許可) または 'prompt' (尋ねる) の状態かを確認
//             const allGranted = results.every(
//                 (result) => result.state === "granted" || result.state === "prompt"
//             );

//             if (!allGranted) {
//                 reject(new Error("必要なセンサーへのアクセスが許可されていません。"));
//                 return;
//             }

//             // AbsoluteOrientationSensor のインスタンスを作成
//             // frequency はデータ取得の頻度 (Hz)。一度の取得なのであまり高くなくても良いが、
//             // 最初のデータがすぐに得られるように適度な値を設定
//             const sensor = new AbsoluteOrientationSensor({ frequency: 60 });

//             let timeoutId; // タイムアウトIDを保持する変数

//             // センサーが読み取り可能になったら (データが利用可能になったら)
//             sensor.onreading = () => {
//                 // タイムアウトが設定されている場合はクリア
//                 if (timeoutId) {
//                     clearTimeout(timeoutId);
//                 }

//                 const quaternion = sensor.quaternion;
//                 // クォータニオンデータが存在しない場合は処理を中断
//                 if (!quaternion) {
//                     return;
//                 }

//                 // クォータニオンからヨー角 (Yaw) へ変換
//                 // ヨー角はZ軸周りの回転を表す
//                 const yawRad = Math.atan2(
//                     2 * (quaternion[1] * quaternion[0] + quaternion[2] * quaternion[3]),
//                     1 - 2 * (quaternion[1] * quaternion[1] + quaternion[2] * quaternion[2])
//                 );

//                 let yawDeg = yawRad * (180 / Math.PI); // ラジアンを度数に変換
//                 yawDeg = (yawDeg + 360) % 360; // 0-360度の範囲に調整

//                 // ヨー角から方角のテキストを生成
//                 let directionText = '';
//                 if (yawDeg >= 337.5 || yawDeg < 22.5) {
//                     directionText = '北';
//                 } else if (yawDeg >= 22.5 && yawDeg < 67.5) {
//                     directionText = '北東';
//                 } else if (yawDeg >= 67.5 && yawDeg < 112.5) {
//                     directionText = '東';
//                 } else if (yawDeg >= 112.5 && yawDeg < 157.5) {
//                     directionText = '南東';
//                 } else if (yawDeg >= 157.5 && yawDeg < 202.5) {
//                     directionText = '南';
//                 } else if (yawDeg >= 202.5 && yawDeg < 247.5) {
//                     directionText = '南西';
//                 } else if (yawDeg >= 247.5 && yawDeg < 292.5) {
//                     directionText = '西';
//                 } else if (yawDeg >= 292.5 && yawDeg < 337.5) {
//                     directionText = '北西';
//                 }

//                 // センサーを停止し、リソースを解放
//                 sensor.stop();
//                 sensor.onreading = null; // イベントリスナーを解除
//                 sensor.onerror = null;

//                 console.log('AbsoluteOrientationSensor を停止しました。');

//                 // ヨー角の数値と方角テキストを含むオブジェクトを解決してPromiseを完了
//                 resolve({ directionNum: yawDeg, directionText: directionText });
//             };

//             // センサーエラー発生時
//             sensor.onerror = (event) => {
//                 // タイムアウトが設定されている場合はクリア
//                 if (timeoutId) {
//                     clearTimeout(timeoutId);
//                 }
//                 // センサーがアクティブな場合は停止
//                 if (sensor.state === 'activated') {
//                     sensor.stop();
//                 }
//                 sensor.onreading = null; // イベントリスナーを解除
//                 sensor.onerror = null;
//                 // エラーメッセージとともにPromiseをReject
//                 reject(new Error(`AbsoluteOrientationSensor エラー: ${event.error.name} - ${event.error.message}`));
//             };

//             // センサーを開始
//             try {
//                 sensor.start();
//                 console.log('AbsoluteOrientationSensor を開始しました...');

//                 // 一定時間内にデータが取得できない場合のタイムアウト処理
//                 // センサーが応答しない場合や、ユーザーが許可を求められたが応答しない場合などに対応
//                 timeoutId = setTimeout(() => {
//                     if (sensor.state === 'activated') {
//                         sensor.stop();
//                     }
//                     sensor.onreading = null;
//                     sensor.onerror = null;
//                     reject(new Error('センサーデータが時間内に取得できませんでした。ユーザーの許可が必要か、デバイスのセンサーに問題がある可能性があります。'));
//                 }, 5000); // 5秒のタイムアウトを設定

//             } catch (error) {
//                 // sensor.start() 自体が失敗した場合（例: 権限がない状態で無理やり開始しようとした場合など）
//                 reject(new Error(`センサーの開始に失敗しました: ${error.message}`));
//             }

//         }).catch((error) => {
//             // 権限確認のPromiseがRejectされた場合
//             reject(new Error(`センサー権限の確認中にエラーが発生しました: ${error.message}`));
//         });
//     });
// }