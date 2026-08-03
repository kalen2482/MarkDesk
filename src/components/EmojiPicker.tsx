import React, { useState, useRef, useEffect, useMemo } from 'react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

interface EmojiCategory {
  name: string
  icon: string
  emojis: string[]
}

const CATEGORIES: EmojiCategory[] = [
  {
    name: '常用',
    icon: '⭐',
    emojis: ['💡', '⭐', '📌', '🚫', '✅', '❌', '❗', '📅', '🎉', '📣', '🔥', '✨', '📝', '🎯', '🔗', '📎', '🏆', '⚡', '🔔', '🔍'],
  },
  {
    name: '表情与角色',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
      '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','😕',
      '😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩',
      '😫','🥱','😤','😡','😠','🤬','😈','👿','💀','💩',
    ],
  },
  {
    name: '手势与身体',
    icon: '👍',
    emojis: [
      '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👋','🤚','🖐️','✋','🖖','👏',
      '🙌','🙏','🤝','💪','✊','👊','🤛','🤜','✍️','💅',
    ],
  },
  {
    name: '动物与自然',
    icon: '🐻',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆',
      '🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦂','🐢','🐍','🦎','🐙','🦑','🦐',
      '🌸','🌺','🌻','🌹','🌷','🌼','🌱','🌲','🌳','🌴','🍀','🍁','🌍','🌙','⭐','🌟','⚡','🔥','🌈','☀️',
    ],
  },
  {
    name: '食物与饮品',
    icon: '☕',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🥦',
      '🍞','🥖','🥨','🧀','🥚','🍳','🥞','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🍜','🍲','🍣','🍱','🍙',
      '🍚','🍰','🎂','🍮','🍦','🍫','🍬','🍭','🍯','☕','🍵','🍺','🍻','🥃','🍷','🥂','🍸','🍹','🍾','🥤',
    ],
  },
  {
    name: '活动与运动',
    icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥅','🏒','🏑','🥍','🏏','⛳','🏹','🎣',
      '🥊','🥋','🎽','⛸️','🥌','🛷','🎿','⛷️','🏂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏆','🥇',
    ],
  },
  {
    name: '物品与符号',
    icon: '💡',
    emojis: [
      '💡','🔦','🕯️','📺','📱','💻','⌨️','🖥️','🖨️','🖱️','💽','💾','💿','📀','📷','📸','📹','🎥','📞','☎️',
      '📟','📠','📺','📻','⏰','⏱️','⏲️','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','📖','📚','✏️','✒️','📌',
      '✅','❌','❗','❓','⚠️','🚫','💯','🔔','🎵','🎶','💰','💱','💲','💳','💸','📧','📨','📩','📤','📥',
    ],
  },
  {
    name: '交通与地点',
    icon: '🚗',
    emojis: [
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🛵','🏍️','🚲','🛴','✈️','🚀','🛸',
      '🚁','⛵','🚢','🚤','🚂','🚆','🚇','🚊','🚉','🚁','🏠','🏡','🏢','🏬','🏭','🏗️','🌉','🌃','🏙️','🌄',
    ],
  },
]

// Keyword dictionary so the search box can find emojis by meaning
// (Chinese or English), instead of only matching category names.
const EMOJI_KEYWORDS: Record<string, string[]> = {
  // 常用
  '💡': ['灯', '灯泡', '创意', '提示', 'idea', 'light', 'bulb'],
  '⭐': ['星', '收藏', 'star', 'favorite'],
  '📌': ['图钉', '固定', 'pin', '钉'],
  '🚫': ['禁止', '停', 'no', 'forbidden'],
  '✅': ['勾', '对', '完成', '正确', 'check', 'done', 'ok'],
  '❌': ['叉', '错', '关闭', '错误', 'cross', 'wrong', 'close'],
  '❗': ['感叹', '重要', '警告', 'exclamation', 'important'],
  '📅': ['日历', '日期', 'calendar', 'date'],
  '🎉': ['庆祝', '恭喜', '派对', 'party', 'celebrate'],
  '📣': ['喇叭', '广播', '通知', 'speaker', 'announce'],
  '🔥': ['火', '热门', 'fire', 'hot'],
  '✨': ['闪', '星光', '亮点', 'sparkle', 'shiny'],
  '📝': ['笔', '笔记', '备忘', 'note', 'pencil', 'memo'],
  '🎯': ['靶', '目标', 'target', 'goal'],
  '🔗': ['链', '链接', 'link'],
  '📎': ['回形针', '附件', 'clip', 'paperclip'],
  '🏆': ['奖', '冠军', '胜利', 'trophy', 'win'],
  '⚡': ['电', '闪电', '快', 'lightning', 'fast'],
  '🔔': ['铃', '提醒', '通知', 'bell', 'reminder'],
  '🔍': ['镜', '搜索', '查找', 'search', 'magnifier'],
  // 表情与角色
  '😀': ['笑', '微笑', 'smile', 'happy'],
  '😃': ['笑', '开心', 'smile', 'grin'],
  '😄': ['笑', '开心', 'happy'],
  '😁': ['笑', 'grin'],
  '😆': ['笑', '哈哈', 'laugh'],
  '😅': ['汗', '苦笑', 'sweat', 'awkward'],
  '🤣': ['大笑', '笑哭', 'rofl', 'lol'],
  '😂': ['大笑', '笑哭', 'cry laugh', 'lol'],
  '🙂': ['微笑', 'slight smile'],
  '🙃': ['倒脸', '调皮', 'upside down'],
  '😉': ['眨眼', '使眼色', 'wink'],
  '😊': ['微笑', '脸红', 'blush', 'smile'],
  '😇': ['天使', '光环', 'angel', 'innocent'],
  '🥰': ['爱', '喜欢', 'love', 'smiling hearts'],
  '😍': ['爱', '花痴', 'heart eyes', 'love'],
  '🤩': ['星星眼', '崇拜', 'star struck'],
  '😘': ['飞吻', '亲', 'kiss', 'love'],
  '😋': ['美味', '舔嘴', 'yum', 'tasty'],
  '😛': ['吐舌', '调皮', 'tongue'],
  '😜': ['眨眼吐舌', '调皮', 'wink tongue'],
  '🤪': ['滑稽', '疯', 'zany', 'crazy'],
  '🤑': ['钱', '贪财', 'money mouth'],
  '🤗': ['拥抱', 'hug'],
  '🤭': ['捂嘴', '偷笑', 'hand over mouth'],
  '🤫': ['嘘', '安静', 'shush', 'quiet'],
  '🤔': ['思考', '想', 'thinking'],
  '🤐': ['闭嘴', '拉链', 'zip mouth'],
  '🤨': ['怀疑', '挑眉', 'raised eyebrow'],
  '😐': ['无表情', 'neutral'],
  '😑': ['面无表情', 'expressionless'],
  '😶': ['无语', '闭嘴', 'no mouth'],
  '😏': ['得意', 'smirk'],
  '😒': ['不屑', '无奈', 'unamused'],
  '🙄': ['翻白眼', '白眼', 'eye roll'],
  '😬': ['龇牙', '尴尬', 'grimacing'],
  '🤥': ['说谎', '长鼻', 'liar'],
  '😌': ['放松', 'relieved'],
  '😔': ['沮丧', 'pensive', 'sad'],
  '😪': ['困', 'sleepy'],
  '🤤': ['流口水', 'drool'],
  '😴': ['睡', 'sleeping', 'zzz'],
  '😷': ['口罩', '生病', 'mask', 'sick'],
  '🤒': ['发烧', '生病', 'thermometer'],
  '🤕': ['受伤', '包', 'head bandage'],
  '🤢': ['恶心', '想吐', 'nauseated'],
  '🤮': ['呕吐', 'vomit'],
  '🥵': ['热', '出汗', 'hot face'],
  '🥶': ['冷', '冻', 'cold face'],
  '😵': ['晕', 'dizzy'],
  '🤯': ['爆炸', '震惊', 'mind blown'],
  '🤠': ['牛仔', 'cowboy'],
  '🥳': ['派对', '庆祝', 'partying'],
  '😎': ['酷', '墨镜', 'cool', 'sunglasses'],
  '🤓': ['书呆', 'nerd', 'glasses'],
  '🧐': [' monocle', '审视', 'monocle'],
  '😕': ['困惑', 'confused'],
  '😟': ['担心', 'worried'],
  '🙁': ['皱眉', 'frown'],
  '😮': ['惊讶', '张嘴', 'open mouth'],
  '😯': ['惊讶', 'hushed'],
  '😲': ['震惊', 'astonished'],
  '😳': ['脸红', '尴尬', 'flushed'],
  '🥺': ['可怜', '恳求', 'pleading'],
  '😦': ['张嘴', 'frowning'],
  '😧': ['痛苦', 'anguished'],
  '😨': ['害怕', 'fearful'],
  '😰': ['冒汗', 'anxious'],
  '😥': ['失望', 'sweat'],
  '😢': ['哭', '伤心', 'cry'],
  '😭': ['大哭', 'sob', 'cry'],
  '😱': ['尖叫', '恐惧', 'scream', 'fear'],
  '😖': ['崩溃', 'confounded'],
  '😣': ['忍耐', 'persevere'],
  '😞': ['失望', 'disappointed'],
  '😓': ['汗', 'cold sweat'],
  '😩': ['累', 'weary'],
  '😫': ['累', 'tired'],
  '🥱': ['打哈欠', 'yawn'],
  '😤': ['哼', 'triumph', 'steam'],
  '😡': ['生气', '怒', 'angry', 'mad'],
  '😠': ['生气', 'angry'],
  '🤬': ['骂', '爆粗', 'cursing'],
  '😈': ['恶魔', '坏', 'devil'],
  '👿': ['恶魔', 'imp'],
  '💀': ['骷髅', '死', 'skull', 'dead'],
  '💩': ['屎', 'poop', 'dung'],
  // 手势与身体
  '👍': ['赞', '好', 'thumbs up', 'ok', 'like'],
  '👎': ['踩', '差', 'thumbs down', 'dislike'],
  '👌': ['ok', '好的', 'ok hand'],
  '✌️': ['耶', '胜利', 'peace', 'victory'],
  '🤞': ['好运', '祈求', 'fingers crossed'],
  '🤟': ['爱', 'love you'],
  '🤘': ['摇滚', 'horns', 'rock'],
  '👈': ['左', 'point left'],
  '👉': ['右', 'point right'],
  '👆': ['上', 'point up'],
  '👇': ['下', 'point down'],
  '☝️': ['上', 'index up'],
  '👋': ['再见', '挥手', 'wave', 'hello'],
  '🤚': ['手背', 'back hand'],
  '🖐️': ['五指', 'hand'],
  '✋': ['停', '手掌', 'raised hand', 'stop'],
  '🖖': ['瓦肯', 'vulcan'],
  '👏': ['鼓掌', 'clap'],
  '🙌': ['举起双手', 'raised hands'],
  '🙏': ['祈祷', '谢谢', 'pray', 'thanks'],
  '🤝': ['握手', '合作', 'handshake'],
  '💪': ['肌肉', '加油', 'flex', 'strong'],
  '✊': ['拳', 'fist'],
  '👊': ['拳', 'punch', 'fist'],
  '🤛': ['左拳', 'left fist'],
  '🤜': ['右拳', 'right fist'],
  '✍️': ['写', '签名', 'writing', 'pen'],
  '💅': ['美甲', 'nail', 'manicure'],
  // 动物与自然
  '🐶': ['狗', 'dog', '小狗'],
  '🐱': ['猫', 'cat', '小猫'],
  '🐭': ['鼠', 'mouse'],
  '🐹': ['仓鼠', 'hamster'],
  '🐰': ['兔', 'rabbit', '兔子'],
  '🦊': ['狐狸', 'fox'],
  '🐻': ['熊', 'bear'],
  '🐼': ['熊猫', 'panda'],
  '🐨': ['考拉', 'koala'],
  '🐯': ['虎', 'tiger'],
  '🦁': ['狮', 'lion'],
  '🐮': ['牛', 'cow'],
  '🐷': ['猪', 'pig'],
  '🐸': ['蛙', 'frog'],
  '🐵': ['猴', 'monkey'],
  '🐔': ['鸡', 'chicken'],
  '🐧': ['企鹅', 'penguin'],
  '🐦': ['鸟', 'bird'],
  '🐤': ['小鸟', '小鸡', 'baby bird'],
  '🦆': ['鸭', 'duck'],
  '🦅': ['鹰', 'eagle'],
  '🦉': ['猫头鹰', 'owl'],
  '🦇': ['蝙蝠', 'bat'],
  '🐺': ['狼', 'wolf'],
  '🐗': ['野猪', 'boar'],
  '🐴': ['马', 'horse'],
  '🦄': ['独角兽', 'unicorn'],
  '🐝': ['蜂', 'bee'],
  '🐛': ['虫', 'bug'],
  '🦋': ['蝴蝶', 'butterfly'],
  '🐌': ['蜗牛', 'snail'],
  '🐞': ['瓢虫', 'ladybug'],
  '🐜': ['蚂蚁', 'ant'],
  '🦂': ['蝎子', 'scorpion'],
  '🐢': ['龟', 'turtle'],
  '🐍': ['蛇', 'snake'],
  '🦎': ['蜥蜴', 'lizard'],
  '🐙': ['章鱼', 'octopus'],
  '🦑': ['鱿鱼', 'squid'],
  '🐠': ['热带鱼', 'tropical fish'],
  '🐟': ['鱼', 'fish'],
  '🌸': ['花', '樱花', 'flower', 'cherry blossom'],
  '🌺': ['花', 'hibiscus'],
  '🌻': ['向日葵', 'sunflower'],
  '🌹': ['玫瑰', 'rose'],
  '🌷': ['郁金香', 'tulip'],
  '🌼': ['雏菊', 'daisy'],
  '🌱': ['苗', '嫩芽', 'seedling'],
  '🌲': ['树', '常青树', 'evergreen'],
  '🌳': ['树', 'deciduous tree'],
  '🌴': ['椰子树', 'palm tree'],
  '🍀': ['四叶草', '幸运', 'clover', 'lucky'],
  '🍁': ['枫叶', 'maple', '落叶'],
  '🌍': ['地球', '世界', 'earth', 'globe'],
  '🌙': ['月亮', 'moon'],
  '🌟': ['星', '闪', 'glowing star'],
  '🌈': ['彩虹', 'rainbow'],
  '☀️': ['太阳', 'sun'],
  // 食物与饮品
  '🍏': ['青苹果', 'green apple'],
  '🍎': ['苹果', 'apple'],
  '🍐': ['梨', 'pear'],
  '🍊': ['橘子', 'orange'],
  '🍋': ['柠檬', 'lemon'],
  '🍌': ['香蕉', 'banana'],
  '🍉': ['西瓜', 'watermelon'],
  '🍇': ['葡萄', 'grape'],
  '🍓': ['草莓', 'strawberry'],
  '🫐': ['蓝莓', 'blueberry'],
  '🍈': ['瓜', 'melon'],
  '🍒': ['樱桃', 'cherry'],
  '🍑': ['桃', 'peach'],
  '🥭': ['芒果', 'mango'],
  '🍍': ['菠萝', 'pineapple'],
  '🥥': ['椰子', 'coconut'],
  '🥝': ['猕猴桃', 'kiwi'],
  '🍅': ['番茄', '西红柿', 'tomato'],
  '🥑': ['牛油果', 'avocado'],
  '🥦': ['西兰花', 'broccoli'],
  '🍞': ['面包', 'bread'],
  '🥖': ['法棍', 'baguette'],
  '🥨': ['椒盐卷', 'pretzel'],
  '🧀': ['奶酪', 'cheese'],
  '🥚': ['蛋', 'egg'],
  '🍳': ['煎蛋', 'fried egg'],
  '🥞': ['松饼', 'pancake'],
  '🥓': ['培根', 'bacon'],
  '🍔': ['汉堡', 'burger'],
  '🍟': ['薯条', 'fries'],
  '🍕': ['披萨', 'pizza'],
  '🌭': ['热狗', 'hotdog'],
  '🥪': ['三明治', 'sandwich'],
  '🌮': ['塔可', 'taco'],
  '🌯': ['卷饼', 'burrito'],
  '🍜': ['面', '拉面', 'noodles', 'ramen'],
  '🍲': ['火锅', 'stew', 'pot'],
  '🍣': ['寿司', 'sushi'],
  '🍱': ['便当', 'bento'],
  '🍙': ['饭团', 'rice ball'],
  '🍚': ['米饭', 'rice'],
  '🍰': ['蛋糕', 'cake'],
  '🎂': ['生日蛋糕', 'birthday cake'],
  '🍮': ['布丁', 'custard', 'pudding'],
  '🍦': ['冰淇淋', 'ice cream'],
  '🍫': ['巧克力', 'chocolate'],
  '🍬': ['糖', 'candy'],
  '🍭': ['棒棒糖', 'lollipop'],
  '🍯': ['蜂蜜', 'honey'],
  '☕': ['咖啡', 'coffee'],
  '🍵': ['茶', 'tea'],
  '🍺': ['啤酒', 'beer'],
  '🍻': ['干杯', 'cheers', 'beers'],
  '🥃': ['酒杯', 'tumbler'],
  '🍷': ['红酒', 'wine'],
  '🥂': ['碰杯', '香槟', 'champagne'],
  '🍸': ['鸡尾酒', 'cocktail'],
  '🍹': ['果汁', 'smoothie', 'drink'],
  '🍾': ['香槟', 'bottle'],
  '🥤': ['饮料', 'cup', 'soda'],
  // 活动与运动
  '⚽': ['足球', 'soccer', 'football'],
  '🏀': ['篮球', 'basketball'],
  '🏈': ['橄榄球', 'american football'],
  '⚾': ['棒球', 'baseball'],
  '🥎': ['垒球', 'softball'],
  '🎾': ['网球', 'tennis'],
  '🏐': ['排球', 'volleyball'],
  '🏉': ['橄榄球', 'rugby'],
  '🥏': ['飞盘', 'frisbee'],
  '🎱': ['台球', 'billiard', 'pool'],
  '🏓': ['乒乓球', 'pingpong', 'table tennis'],
  '🏸': ['羽毛球', 'badminton'],
  '🥅': ['球门', 'goal'],
  '🏒': ['冰球', 'hockey'],
  '🏑': ['曲棍球', 'field hockey'],
  '🥍': ['兜网球', 'lacrosse'],
  '🏏': ['板球', 'cricket'],
  '⛳': ['高尔夫', 'golf'],
  '🏹': ['弓箭', 'bow', 'archery'],
  '🎣': ['钓鱼', 'fishing'],
  '🥊': ['拳击', 'boxing'],
  '🥋': ['空手道', 'martial arts'],
  '🎽': ['赛跑', 'running', 'track'],
  '⛸️': ['滑冰', 'ice skate'],
  '🥌': ['冰壶', 'curling'],
  '🛷': ['雪橇', 'sled'],
  '🎿': ['滑雪', 'ski'],
  '⛷️': ['滑雪', 'skier'],
  '🏂': ['单板', 'snowboard'],
  '🏋️': ['举重', 'weightlifting', 'gym'],
  '🤼': ['摔跤', 'wrestling'],
  '🤸': ['体操', 'cartwheel'],
  '⛹️': ['跳', 'jump'],
  '🤺': ['击剑', 'fencing'],
  '🤾': ['手球', 'handball'],
  '🏌️': ['高尔夫人', 'golfer'],
  '🏇': ['赛马', 'horse racing'],
  '🧘': ['瑜伽', 'meditate', 'yoga'],
  '🥇': ['金牌', 'gold medal', 'first'],
  // 物品与符号
  '🔦': ['手电', 'flashlight'],
  '🕯️': ['蜡烛', 'candle'],
  '📺': ['电视', 'tv'],
  '📱': ['手机', 'phone', 'mobile'],
  '💻': ['电脑', '笔记本', 'laptop'],
  '⌨️': ['键盘', 'keyboard'],
  '🖥️': ['台式机', 'desktop', 'monitor'],
  '🖨️': ['打印机', 'printer'],
  '🖱️': ['鼠标', 'mouse'],
  '💽': ['磁盘', 'disk'],
  '💾': ['软盘', '保存', 'floppy', 'save'],
  '💿': ['光盘', 'cd'],
  '📷': ['相机', 'camera', '拍照'],
  '📸': ['相机', 'camera'],
  '📹': ['摄像机', 'video camera'],
  '🎥': ['电影机', 'movie camera'],
  '📞': ['电话', 'phone', 'telephone'],
  '☎️': ['电话', 'telephone'],
  '📟': ['传呼', 'pager'],
  '📠': ['传真', 'fax'],
  '📻': ['收音机', 'radio'],
  '⏰': ['闹钟', '时钟', 'clock', 'alarm'],
  '⏱️': ['秒表', 'stopwatch'],
  '⏲️': ['定时器', 'timer'],
  '🕰️': ['座钟', 'mantel clock'],
  '⌛': ['沙漏', 'hourglass'],
  '⏳': ['沙漏', 'hourglass'],
  '📡': ['卫星', '天线', 'satellite'],
  '🔋': ['电池', 'battery'],
  '🔌': ['插头', 'plug'],
  '📖': ['书', '打开的书', 'book', 'open book'],
  '📚': ['书', 'books', '书架'],
  '✏️': ['铅笔', 'pencil'],
  '✒️': ['钢笔', 'pen'],
  '❓': ['问号', 'question'],
  '⚠️': ['警告', '注意', 'warning'],
  '💯': ['满分', '100', 'hundred'],
  '🎵': ['音乐', '音符', 'music', 'note'],
  '🎶': ['音乐', '音符', 'music'],
  '💰': ['钱', 'money', 'bag'],
  '💱': ['兑换', 'currency exchange'],
  '💲': ['美元', 'dollar'],
  '💳': ['信用卡', 'card', 'credit'],
  '💸': ['钱', 'money wings'],
  '📧': ['邮件', 'email', 'mail'],
  '📨': ['来信', 'incoming mail'],
  '📩': ['包裹', 'outgoing mail'],
  '📤': ['发出', 'outbox'],
  '📥': ['收件', 'inbox'],
  // 交通与地点
  '🚗': ['汽车', 'car'],
  '🚕': ['出租车', 'taxi'],
  '🚙': ['suv', '车'],
  '🚌': ['公交', 'bus'],
  '🚎': ['电车', 'trolleybus'],
  '🏎️': ['跑车', 'racing car'],
  '🚓': ['警车', 'police car'],
  '🚑': ['救护车', 'ambulance'],
  '🚒': ['消防车', 'fire truck'],
  '🚐': ['面包车', 'van'],
  '🚚': ['卡车', 'truck'],
  '🚛': ['大卡车', 'articulated truck'],
  '🚜': ['拖拉机', 'tractor'],
  '🛵': ['摩托', 'scooter'],
  '🏍️': ['摩托车', 'motorcycle'],
  '🚲': ['自行车', 'bike', 'bicycle'],
  '🛴': ['滑板车', 'kick scooter'],
  '✈️': ['飞机', 'plane', 'airplane'],
  '🚀': ['火箭', 'rocket'],
  '🛸': ['飞碟', 'ufo'],
  '🚁': ['直升机', 'helicopter'],
  '⛵': ['帆船', 'sailboat'],
  '🚢': ['船', 'ship'],
  '🚤': ['快艇', 'speedboat'],
  '🚂': ['火车头', 'locomotive'],
  '🚆': ['火车', 'train'],
  '🚇': ['地铁', 'metro', 'subway'],
  '🚊': ['电车', 'tram'],
  '🚉': ['火车站', 'station'],
  '🏠': ['家', '房子', 'house', 'home'],
  '🏡': ['家', '带花园的房子', 'house with garden'],
  '🏢': ['办公室', '大楼', 'office', 'building'],
  '🏬': ['百货', 'department store'],
  '🏭': ['工厂', 'factory'],
  '🏗️': ['建筑', 'construction'],
  '🌉': ['桥', 'bridge'],
  '🌃': ['夜景', 'night'],
  '🏙️': ['城市', 'city'],
  '🌄': ['日出', 'mountain sunrise'],
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(0)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const filteredEmojis = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    const results: string[] = []
    const seen = new Set<string>()
    const add = (e: string) => { if (!seen.has(e)) { seen.add(e); results.push(e) } }
    for (const cat of CATEGORIES) {
      // Category name match still works (e.g. "食物", "动物")
      if (cat.name.toLowerCase().includes(q)) {
        cat.emojis.forEach(add)
        continue
      }
      // Keyword match: find emojis by meaning (Chinese/English)
      for (const e of cat.emojis) {
        const kw = EMOJI_KEYWORDS[e]
        if (kw && kw.some((k) => k.toLowerCase().includes(q))) {
          add(e)
        }
      }
    }
    return results
  }, [search])

  const currentEmojis = filteredEmojis || CATEGORIES[activeCategory].emojis
  const noResults = filteredEmojis !== null && currentEmojis.length === 0

  const handleClick = (emoji: string) => {
    onSelect(emoji)
    onClose()
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface border border-whisper-border dark:border-dark-border rounded-notion-card shadow-notion-deep z-50 w-[320px] h-[360px] flex flex-col"
      role="dialog"
      aria-label="选择表情"
    >
      {/* Search */}
      <div className="p-2 border-b border-whisper-border dark:border-dark-border">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-warm-white dark:bg-dark-bg border border-whisper-border dark:border-dark-border rounded-notion outline-none focus:border-notion-blue text-near-black dark:text-dark-text"
            autoFocus
          />
        </div>
      </div>

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {!filteredEmojis && (
          <div className="text-xs font-medium text-warm-gray-400 dark:text-dark-text-muted px-1 py-1">
            {CATEGORIES[activeCategory].name}
          </div>
        )}
        {noResults ? (
          <div className="text-sm text-warm-gray-400 dark:text-dark-text-muted px-1 py-6 text-center">
            未找到匹配“{search}”的表情
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {currentEmojis.map((emoji, i) => (
              <button
                key={i}
                className="w-8 h-8 flex items-center justify-center text-xl rounded hover:bg-warm-white dark:hover:bg-white/5 transition-colors"
                onClick={() => handleClick(emoji)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category bar */}
      {!filteredEmojis && (
        <div className="flex items-center justify-around border-t border-whisper-border dark:border-dark-border py-1">
          {CATEGORIES.map((cat, i) => (
            <button
              key={i}
              className={`w-8 h-8 flex items-center justify-center text-base rounded transition-colors relative ${
                activeCategory === i
                  ? 'text-notion-blue'
                  : 'text-warm-gray-400 hover:text-near-black dark:hover:text-dark-text'
              }`}
              onClick={() => setActiveCategory(i)}
              onMouseDown={(e) => e.preventDefault()}
              aria-label={cat.name}
            >
              {cat.icon}
              {activeCategory === i && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-notion-blue" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
