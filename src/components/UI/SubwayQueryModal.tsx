import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Card, List, Typography, Space, Row, Col, Divider, Tag } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import MapContainer from '../Map/MapContainer';

const { Title, Text } = Typography;
const { Option } = Select;

// 城市地铁站点坐标数据（简化版，用于路径绘制）
const cityStations: Record<string, Record<string, { lng: number, lat: number }>> = {
  北京: {
  // 4号线主要站点
  '安河桥北': { lng: 116.2699, lat: 40.0119 },
  '北宫门': { lng: 116.2775, lat: 39.9246 },
  '西苑': { lng: 116.2909, lat: 39.9074 },
  '圆明园': { lng: 116.3101, lat: 39.9997 },
  '北京大学东门': { lng: 116.3158, lat: 39.9923 },
  '中关村': { lng: 116.3165, lat: 39.9839 },
  '海淀黄庄': { lng: 116.3176, lat: 39.9759 },
  '人民大学': { lng: 116.3214, lat: 39.9669 },
  '魏公村': { lng: 116.3232, lat: 39.9578 },
  '国家图书馆': { lng: 116.3252, lat: 39.9434 },
  '动物园': { lng: 116.3390, lat: 39.9384 },
  '西直门': { lng: 116.3514, lat: 39.9405 },
  '新街口': { lng: 116.3677, lat: 39.9406 },
  '平安里': { lng: 116.3728, lat: 39.9338 },
  '西四': { lng: 116.3733, lat: 39.9242 },
  '灵境胡同': { lng: 116.3737, lat: 39.9158 },
  '西单': { lng: 116.3743, lat: 39.9074 },
  '宣武门': { lng: 116.3743, lat: 39.8997 },
  '菜市口': { lng: 116.3744, lat: 39.8893 },
  '陶然亭': { lng: 116.3744, lat: 39.8785 },
  '北京南站': { lng: 116.3789, lat: 39.8650 },
  '马家堡': { lng: 116.3713, lat: 39.8532 },
  '角门西': { lng: 116.3712, lat: 39.8459 },
  '公益西桥': { lng: 116.3708, lat: 39.8361 },

  // 5号线主要站点
  '宋家庄': { lng: 116.4284, lat: 39.8458 },
  '刘家窑': { lng: 116.4220, lat: 39.8574 },
  '蒲黄榆': { lng: 116.4169, lat: 39.8656 },
  '天坛东门': { lng: 116.4208, lat: 39.8828 },
  '磁器口': { lng: 116.4199, lat: 39.8932 },
  '崇文门': { lng: 116.4171, lat: 39.9010 },
  '东单': { lng: 116.4181, lat: 39.9083 },
  '灯市口': { lng: 116.4177, lat: 39.9171 },
  '东四': { lng: 116.4175, lat: 39.9244 },
  '张自忠路': { lng: 116.4171, lat: 39.9332 },
  '北新桥': { lng: 116.4168, lat: 39.9409 },
  '雍和宫': { lng: 116.4171, lat: 39.9493 },
  '和平里北街': { lng: 116.4185, lat: 39.9587 },
  '和平西桥': { lng: 116.4179, lat: 39.9684 },

  // 15号线主要站点
  '俸伯': { lng: 116.6886, lat: 40.1325 },
  '顺义': { lng: 116.6572, lat: 40.1302 },
  '石门': { lng: 116.6411, lat: 40.1298 },
  '南法信': { lng: 116.6080, lat: 40.1283 },
  '后沙峪': { lng: 116.5642, lat: 40.1141 },
  '花梨坎': { lng: 116.5542, lat: 40.0844 },
  '国展': { lng: 116.5556, lat: 40.0701 },
  '孙河': { lng: 116.5347, lat: 40.0451 },
  '马泉营': { lng: 116.5038, lat: 40.0340 },
  '崔各庄': { lng: 116.4897, lat: 40.0227 },
  '望京': { lng: 116.4694, lat: 39.9987 },
  '望京西': { lng: 116.4496, lat: 39.9959 },
  '关庄': { lng: 116.4308, lat: 39.9878 },
  '大屯路东': { lng: 116.4172, lat: 39.9840 },
  '安立路': { lng: 116.4077, lat: 39.9929 },
  '奥林匹克公园': { lng: 116.3919, lat: 40.0023 },
  '北沙滩': { lng: 116.3682, lat: 40.0015 },
  '六道口': { lng: 116.3524, lat: 40.0007 },
  '清华东路西口': { lng: 116.3395, lat: 40.0006 },
},
深圳: {
  // 深圳主要站点坐标（示例）
  '罗湖': { lng: 114.1317, lat: 22.5315 },
  '福田': { lng: 114.0549, lat: 22.5410 },
  '南山': { lng: 113.9304, lat: 22.5316 },
  '宝安中心': { lng: 113.8840, lat: 22.5553 },
  '深圳北站': { lng: 114.0294, lat: 22.6088 },
  '车公庙': { lng: 114.0211, lat: 22.5370 },
  '华强北': { lng: 114.0891, lat: 22.5445 },
  '世界之窗': { lng: 113.9768, lat: 22.5374 },
  '会展中心': { lng: 114.0581, lat: 22.5315 },
  '购物公园': { lng: 114.0509, lat: 22.5318 },
  '岗厦': { lng: 114.0597, lat: 22.5319 },
  '华强路': { lng: 114.0869, lat: 22.5445 },
  '科学馆': { lng: 114.0973, lat: 22.5444 },
  '大剧院': { lng: 114.1018, lat: 22.5443 },
  '市民中心': { lng: 114.0643, lat: 22.5430 },
  '少年宫': { lng: 114.0581, lat: 22.5432 },
  '莲花北': { lng: 114.0581, lat: 22.5548 },
  '上梅林': { lng: 114.0581, lat: 22.5701 },
  '白石龙': { lng: 114.0581, lat: 22.6098 },
  // 其他主要站点可以继续添加
},
上海: {
  // 上海主要站点坐标（示例）
  '人民广场': { lng: 121.4784, lat: 31.2354 },
  '徐家汇': { lng: 121.4376, lat: 31.1949 },
  '上海火车站': { lng: 121.4592, lat: 31.2492 },
  '上海南站': { lng: 121.4288, lat: 31.1561 },
  '陆家嘴': { lng: 121.5065, lat: 31.2397 },
  '浦东国际机场': { lng: 121.8052, lat: 31.1515 },
},
广州: {
  // 广州主要站点坐标（示例）
  '广州火车站': { lng: 113.2644, lat: 23.1483 },
  '天河客运站': { lng: 113.3352, lat: 23.1712 },
  '珠江新城': { lng: 113.3216, lat: 23.1193 },
  '广州塔': { lng: 113.3218, lat: 23.1067 },
  '北京路': { lng: 113.2708, lat: 23.1189 },
  '越秀公园': { lng: 113.2649, lat: 23.1384 },
},
杭州: {
  // 杭州主要站点坐标（示例）
  '杭州火车东站': { lng: 120.2102, lat: 30.2936 },
  '武林广场': { lng: 120.1582, lat: 30.2740 },
  '西湖文化广场': { lng: 120.1544, lat: 30.2774 },
  '城站': { lng: 120.1551, lat: 30.2469 },
  '庆春广场': { lng: 120.1746, lat: 30.2574 },
  '江陵路': { lng: 120.2038, lat: 30.2687 },
    }
}

// 地铁线路数据（按城市分组）
const subwayData: Record<string, any[]> = {
  北京: [
    { id: '1', name: '1号线', color: '#E4002B', stations: ['苹果园', '古城', '雍和宫', '天安门西', '天安门东', '王府井', '东单', '建国门', '永安里', '国贸', '大望路', '四惠', '四惠东'] },
    { id: '2', name: '2号线', color: '#004B87', stations: ['西直门', '积水潭', '鼓楼大街', '安定门', '雍和宫', '东直门', '东四十条', '朝阳门', '建国门', '北京站', '崇文门', '前门', '和平门'] },
    { id: '4', name: '4号线', color: '#008C95', stations: ['安河桥北', '北宫门', '西苑', '圆明园', '北京大学东门', '中关村', '海淀黄庄', '人民大学', '魏公村', '国家图书馆', '动物园', '西直门', '新街口', '平安里', '西四', '灵境胡同', '西单', '宣武门', '菜市口', '陶然亭', '北京南站', '马家堡', '角门西', '公益西桥'] },
    { id: '5', name: '5号线', color: '#A0004C', stations: ['宋家庄', '刘家窑', '蒲黄榆', '天坛东门', '磁器口', '崇文门', '东单', '灯市口', '东四', '张自忠路', '北新桥', '雍和宫', '和平里北街', '和平西桥', '惠新西街南口', '惠新西街北口', '大屯路东', '北苑路北', '立水桥南', '立水桥', '天通苑南', '天通苑', '天通苑北'] },
    { id: '6', name: '6号线', color: '#B35A20', stations: ['海淀五路居', '慈寿寺', '花园桥', '白石桥南', '车公庄西', '车公庄', '平安里', '北海北', '南锣鼓巷', '东四', '朝阳门', '东大桥', '呼家楼', '金台路', '十里堡', '青年路', '褡裢坡', '黄渠', '常营', '草房', '物资学院路', '通州北关', '通运门', '北运河西', '郝家府', '东夏园', '潞城'] },
    { id: '7', name: '7号线', color: '#F2C172', stations: ['北京西站', '湾子', '达官营', '广安门内', '菜市口', '虎坊桥', '珠市口', '桥湾', '磁器口', '广渠门内', '广渠门外', '双井', '九龙山', '大郊亭', '百子湾', '化工', '南楼梓庄', '欢乐谷景区', '垡头', '双合', '焦化厂'] },
    { id: '8', name: '8号线', color: '#009B77', stations: ['朱辛庄', '育知路', '平西府', '回龙观东大街', '霍营', '育新', '西小口', '永泰庄', '林萃桥', '森林公园南门', '奥林匹克公园', '奥体中心', '北土城', '安华桥', '安德里北街', '鼓楼大街', '什刹海', '南锣鼓巷'] },
    { id: '9', name: '9号线', color: '#8FC31F', stations: ['国家图书馆', '白石桥南', '白堆子', '军事博物馆', '北京西站', '六里桥东', '六里桥', '七里庄', '丰台东大街', '丰台南路', '科怡路', '丰台科技园', '郭公庄'] },
    { id: '10', name: '10号线', color: '#009BC0', stations: ['巴沟', '苏州街', '海淀黄庄', '知春里', '知春路', '西土城', '牡丹园', '健德门', '北土城', '安贞门', '惠新西街南口', '芍药居', '太阳宫', '三元桥', '亮马桥', '农业展览馆', '团结湖', '呼家楼', '金台夕照', '国贸', '双井', '劲松', '潘家园', '十里河', '分钟寺', '成寿寺', '宋家庄', '石榴庄', '大红门', '角门东', '角门西', '草桥', '纪家庙', '首经贸', '丰台站', '泥洼', '西局', '六里桥', '莲花桥', '公主坟', '西钓鱼台', '慈寿寺', '车道沟', '长春桥', '火器营'] },
    { id: '13', name: '13号线', color: '#F9E700', stations: ['西直门', '大钟寺', '知春路', '五道口', '上地', '西二旗', '龙泽', '回龙观', '霍营', '立水桥', '北苑', '望京西', '芍药居', '光熙门', '柳芳', '东直门'] },
    { id: '14', name: '14号线', color: '#D4A7A2', stations: ['张郭庄', '园博园', '大瓦窑', '郭庄子', '大井', '七里庄', '西局', '北京南站', '永定门外', '景泰', '蒲黄榆', '方庄', '十里河', '南八里庄', '北工大西门', '平乐园', '九龙山', '大望路', '金台路', '朝阳公园', '枣营', '东风北桥', '将台', '望京南', '阜通', '望京', '东湖渠', '来广营', '善各庄'] },
    { id: '15', name: '15号线', color: '#5D2D69', stations: ['俸伯', '顺义', '石门', '南法信', '后沙峪', '花梨坎', '国展', '孙河', '马泉营', '崔各庄', '望京', '望京西', '关庄', '大屯路东', '安立路', '奥林匹克公园', '北沙滩', '六道口', '清华东路西口'] },
    { id: '16', name: '16号线', color: '#7B4D94', stations: ['西苑', '农大南路', '马连洼', '西北旺', '永丰南', '永丰', '屯佃', '稻香湖路', '温阳路', '北安河'] },
    { id: '17', name: '17号线', color: '#E6609A', stations: ['未来科技城北', '未来科技城', '经海路', '次渠南', '次渠', '亦庄火车站', '大郊亭桥', '公益西桥', '新宫', '西红门', '高米店北', '高米店南', '枣园', '清源路', '黄村西大街', '黄村火车站', '义和庄', '生物医药基地', '天宫院'] },
    { id: '19', name: '19号线', color: '#E6609A', stations: ['牡丹园', '北土城', '安贞门', '关庄', '望京西'] },
    { id: '22', name: '22号线', color: '#F2C172', stations: ['东大桥', '永定门外', '景泰', '方庄', '北京南站', '永定门外', '景泰', '方庄', '北京南站'] },
  ],
  深圳: [
    { id: '1', name: '1号线', color: '#1E5B9A', stations: ['罗湖', '国贸', '老街', '大剧院', '科学馆', '华强路', '岗厦', '会展中心', '购物公园', '香蜜湖', '车公庙', '竹子林', '侨城东', '华侨城', '世界之窗', '白石洲', '高新园', '深大', '桃园', '大新', '鲤鱼门', '前海湾', '新安', '宝安中心', '宝体', '坪洲', '西乡', '固戍', '后瑞', '机场东'] },
    { id: '2', name: '2号线', color: '#E60012', stations: ['赤湾', '蛇口港', '湾厦', '登良', '后海', '科苑', '红树湾', '世界之窗', '侨城北', '深康', '安托山', '侨香', '香蜜', '香梅北', '景田', '莲花西', '福田', '市民中心', '岗厦北', '华强北', '燕南', '大剧院', '湖贝', '黄贝岭', '新秀'] },
    { id: '3', name: '3号线', color: '#F9E700', stations: ['益田', '石厦', '购物公园', '福田', '少年宫', '莲花村', '华新', '通新岭', '红岭', '老街', '晒布', '翠竹', '田贝', '水贝', '草埔', '布吉', '木棉湾', '大芬', '丹竹头', '六约', '塘坑', '横岗', '永湖', '荷坳', '大运', '爱联', '吉祥', '龙城广场', '南联', '双龙'] },
    { id: '4', name: '4号线', color: '#4A90E2', stations: ['福田口岸', '福民', '会展中心', '市民中心', '少年宫', '莲花北', '上梅林', '民乐', '白石龙', '深圳北站', '红山', '上塘', '龙胜', '龙华', '清湖', '清湖北', '竹村', '茜坑', '沙井', '沙井西', '歌隆', '松岗', '后亭', '牛湖'] },
    { id: '5', name: '5号线', color: '#8B5A2B', stations: ['赤湾', '荔湾', '铁路公园', '妈湾', '前湾公园', '前湾', '桂湾', '前海湾公园', '临海', '宝华', '宝安中心', '翻身', '灵芝', '洪浪北', '兴东', '留仙洞', '西丽', '大学城', '塘朗', '长岭陂', '深圳北站', '民治', '五和', '坂田', '杨美', '上水径', '下水径', '长龙', '布吉', '百鸽笼', '布心', '太安', '怡景', '黄贝岭'] },
    { id: '6', name: '6号线', color: '#D2691E', stations: ['科学馆', '通新岭', '体育中心', '八卦岭', '银湖', '翰岭', '梅林关', '深圳北站', '红山', '光雅园', '楼村', '石井', '官田', '国展', '窗台', '银塘', '官龙', '虾田', '松岗公园', '溪头', '松岗', '万象城', '杨美', '上芬', '元芬', '阳台山东', '官田围', '丰树', '鹿丹村', '上屋', '九围', '凤凰城', '光明城'] },
    { id: '7', name: '7号线', color: '#8B4513', stations: ['西丽湖', '西丽', '茶光', '珠光', '龙井', '桃源村', '深云', '农林', '华南城', '六约', '黄木岗', '太和', '田贝', '上沙', '沙尾', '石厦', '皇岗村', '福民', '皇岗口岸', '赤尾', '华强南', '华强北', '华新', '黄木岗', '田贝四方', '石厦', '皇岗村', '福民', '皇岗口岸'] },
    { id: '8', name: '8号线', color: '#228B22', stations: ['梧桐山南', '沙头角', '海山', '盐田港西', '盐田港东', '海天', '盐田路', '沙头角', '小梅沙', '梅沙', '盐田', '盐田北', '深外高中', '盐港', '海山', '盐田港西'] },
    { id: '9', name: '9号线', color: '#FF69B4', stations: ['前湾', '梦海', '怡海', '荔林', '南油', '南油西', '深大南', '高新南四道', '高新南三道', '高新南二道', '高新南', '红树湾南', '深湾', '深圳湾公园', '下沙', '车公庙', '香梅', '景田', '梅景', '下梅林', '梅村', '上梅林', '孖岭', '银湖', '泥岗', '福田口岸'] },
    { id: '10', name: '10号线', color: '#9370DB', stations: ['双拥街', '鹅公坳', '南坑', '平湖', '赖屋山', '清湖', '清湖北', '江围', '吉莲', '雪象', '雅宝', '坪洲', '马田', '前海', '临海', '宝华', '宝安中心', '兴业', '福永', '桥头', '塘尾', '马安山', '沙井', '后亭', '松岗', '溪头', '松岗公园', '官田', '楼村', '光雅园', '红山', '深圳北站', '白石龙', '上梅林', '莲花北', '少年宫', '市民中心', '岗厦北', '华强北', '黄贝岭', '八卦岭', '银湖', '泥岗', '福田口岸'] },
    { id: '11', name: '11号线', color: '#DC143C', stations: ['福田', '车公庙', '红树湾', '侨城东', '华侨城', '竹子林', '侨城北', '深大', '桃园', '大新', '鲤鱼门', '前海湾', '南山', '后海', '红树湾南', '车公庙', '福田'] },
    { id: '12', name: '12号线', color: '#FFD700', stations: ['海上田园东', '水贝', '翠竹', '田心', '水库', '桥头', '白石洲', '高新园', '深大', '桃园', '南山', '粤海门', '前海湾', '宝安', '宝华', '兴业', '福永', '桥头', '塘尾', '马安山', '沙井', '后亭', '松岗', '溪头', '松岗公园', '官田', '楼村', '光雅园', '红山', '深圳北站', '白石龙', '上梅林', '莲花北', '少年宫', '市民中心', '岗厦北', '华强北', '黄贝岭', '八卦岭', '银湖', '泥岗', '福田口岸'] },
    { id: '13', name: '13号线', color: '#FF6347', stations: ['高新南', '红树湾南', '深湾', '深圳湾公园', '下沙', '车公庙', '香梅', '景田', '梅景', '下梅林', '梅村', '上梅林', '孖岭', '银湖', '泥岗', '福田口岸', '皇岗口岸', '福民', '皇岗村', '石厦', '购物公园', '香蜜湖', '会展中心', '岗厦', '华强路', '科学馆', '华强北', '华新', '黄贝岭', '田贝', '布吉', '木棉湾', '大芬', '丹竹头', '六约', '塘坑', '横岗', '永湖', '荷坳', '大运', '爱联', '吉祥', '龙城广场', '南联', '双龙'] },
    { id: '14', name: '14号线', color: '#00CED1', stations: ['岗厦北', '华强北', '华新', '黄贝岭', '田贝', '布吉', '木棉湾', '大芬', '丹竹头', '六约', '塘坑', '横岗', '永湖', '荷坳', '大运', '爱联', '吉祥', '龙城广场', '南联', '双龙', '坪山围', '坪山', '江岭', '沙田', '石井', '官田', '国展', '窗台', '银塘', '官龙', '虾田', '松岗公园', '溪头', '松岗', '万象城', '杨美', '上芬', '元芬', '阳台山东', '官田围', '丰树', '鹿丹村', '上屋', '九围', '凤凰城', '光明城', '公明北', '合水口', '马田', '坪洲', '宝安中心', '宝华', '兴业', '福永', '桥头', '塘尾', '马安山', '沙井', '后亭'] },
  ],
  上海: [
    { id: '1', name: '1号线', color: '#E4002B', stations: ['莘庄', '外环路', '莲花路', '锦江乐园', '上海南站', '漕宝路', '上海体育馆', '徐家汇', '衡山路', '常熟路', '陕西南路', '黄陂南路', '人民广场', '新闸路', '汉中路', '上海火车站', '中山北路', '延长路', '上海马戏城', '汶水路', '彭浦新村', '共康路', '通河新村', '呼兰路', '共富新村', '宝安公路', '友谊西路', '富锦路'] },
    { id: '2', name: '2号线', color: '#4A90E2', stations: ['浦东国际机场', '海天三路', '浦东大道', '杨高北路', '世纪大道', '上海科技馆', '世纪公园', '龙阳路', '张江高科', '金科路', '广兰路', '唐镇', '创新中路', '华夏东路', '川沙', '凌空路', '远东大道', '海天三路', '浦东国际机场'] },
    { id: '3', name: '3号线', color: '#FFD700', stations: ['上海南站', '石龙路', '龙漕路', '漕溪路', '宜山路', '虹桥路', '延安西路', '中山公园', '金沙江路', '曹杨路', '镇坪路', '中潭路', '上海火车站', '宝山路', '东宝兴路', '虹口足球场', '赤峰路', '大柏树', '江湾镇', '殷高西路', '长江南路', '淞发路', '张华浜', '淞滨路', '水产路', '宝杨路', '友谊路', '铁力路', '江杨北路'] },
    { id: '4', name: '4号线', color: '#228B22', stations: ['宜山路', '上海体育馆', '上海体育场', '东安路', '大木桥路', '鲁班路', '西藏南路', '南浦大桥', '塘桥', '蓝村路', '浦电路', '世纪大道', '浦东大道', '杨树浦路', '大连路', '临沂新村', '上海体育场', '东安路', '大木桥路', '鲁班路', '西藏南路', '南浦大桥', '塘桥', '蓝村路', '浦电路', '世纪大道', '浦东大道', '杨树浦路', '大连路', '临沂新村'] },
    { id: '5', name: '5号线', color: '#8B4513', stations: ['莘庄', '春申路', '银都路', '颛桥', '北桥', '剑川路', '东川路', '金平路', '华宁路', '文井路', '闵行开发区'] },
    { id: '6', name: '6号线', color: '#DC143C', stations: ['港城路', '外高桥保税区北', '航津路', '外高桥保税区南', '洲海路', '五洲大道', '东靖路', '巨峰路', '五莲路', '博兴路', '金桥路', '云山路', '德平路', '北洋泾路', '民生路', '源深体育中心', '世纪大道', '浦电路', '蓝村路', '上海儿童医学中心', '临沂新村', '高科西路', '东明路', '高青路', '华夏西路', '上南路', '灵岩南路', '东方体育中心'] },
    { id: '7', name: '7号线', color: '#9370DB', stations: ['美兰湖', '罗南新村', '潘广路', '刘行', '顾村公园', '祁华路', '上海大学', '南陈路', '上大路', '场中路', '大场镇', '行知路', '大华三路', '新村路', '岚皋路', '镇坪路', '长寿路', '昌平路', '静安寺', '南京西路', '人民广场', '大世界', '老西门', '豫园', '南京东路', '彙川路', '东安路', '龙华中路', '后滩', '长清路', '耀华路', '云台路', '高科西路', '杨高南路', '锦绣路', '芳华路', '龙阳路', '花木路'] },
    { id: '8', name: '8号线', color: '#FF69B4', stations: ['沈杜公路', '联航路', '江月路', '浦江镇', '芦恒路', '凌兆新村', '东方体育中心', '杨思', '成山路', '耀华路', '中华艺术宫', '西藏南路', '陆家浜路', '老西门', '大世界', '人民广场', '曲阜路', '中兴路', '西藏北路', '中宁路', '虹口足球场', '曲阳路', '四平路', '鞍山新村', '江浦路', '黄兴路', '延吉中路', '黄兴公园', '翔殷路', '嫩江路', '市光路'] },
    { id: '9', name: '9号线', color: '#FF6347', stations: ['松江南站', '醉白池', '松江体育中心', '松江大学城', '洞泾', '佘山', '泗泾', '九亭', '中春路', '七宝', '星中路', '合川路', '漕河泾开发区', '桂林路', '宜山路', '徐家汇', '肇嘉浜路', '嘉善路', '打浦桥', '马当路', '陆家浜路', '老西门', '豫园', '南京东路', '天潼路', '四川北路', '海伦路', '娄山关路', '长风公园', '淞滨路', '张华浜', '淞发路', '长江南路', '殷高西路', '江湾镇', '大柏树', '赤峰路', '虹口足球场', '东宝兴路', '宝山路'] },
    { id: '10', name: '10号线', color: '#00CED1', stations: ['新江湾城', '殷高西路', '三门路', '江湾体育场', '五角场', '国权路', '同济大学', '四平路', '邮电新村', '海伦路', '四川北路', '天潼路', '南京东路', '豫园', '老西门', '新天地', '陕西南路', '上海图书馆', '交通大学', '虹桥路', '宋园路', '伊犁路', '水城路', '龙溪路', '龙柏新村', '紫藤路', '航中路'] },
    { id: '11', name: '11号线', color: '#D2691E', stations: ['迪士尼', '康新公路', '秀沿路', '罗山路', '御桥', '浦三路', '三林东', '浦东大道', '杨高北路', '金桥', '隆德路', '张江路', '龙阳路', '世纪大道', '源深体育中心', '民生路', '北洋泾路', '德平路', '云山路', '金桥路', '博兴路', '五莲路', '巨峰路', '东靖路', '五洲大道', '洲海路', '外高桥保税区南', '航津路', '外高桥保税区北', '港城路'] },
    { id: '12', name: '12号线', color: '#8FC31F', stations: ['七莘路', '虹莘路', '顾戴路', '东兰路', '虹梅路', '虹漕路', '桂林公园', '漕宝路', '龙漕路', '龙华', '龙华中路', '大木桥路', '嘉善路', '陕西南路', '南京西路', '汉中路', '曲阜路', '天潼路', '国际客运中心', '提篮桥', '大连路', '杨树浦路', '浦东大道', '世纪大道', '源深体育中心', '浦电路', '蓝村路', '上海儿童医学中心', '临沂新村', '高科西路', '东明路', '高青路', '华夏西路', '上南路', '灵岩南路', '东方体育中心'] },
    { id: '13', name: '13号线', color: '#F9E700', stations: ['金运路', '金沙江西路', '丰庄', '祁连山路', '真北路', '大渡河路', '金沙江路', '隆德路', '武宁路', '长寿路', '江宁路', '汉中路', '自然博物馆', '南京西路', '淮海中路', '新天地', '马当路', '世博会博物馆', '世博大道', '浦东大道', '杨高北路', '金桥', '隆德路', '张江路', '龙阳路', '世纪大道', '源深体育中心', '民生路', '北洋泾路', '德平路', '云山路', '金桥路', '博兴路', '五莲路', '巨峰路', '东靖路', '五洲大道', '洲海路', '外高桥保税区南', '航津路', '外高桥保税区北', '港城路'] },
    { id: '14', name: '14号线', color: '#8B5A2B', stations: ['封浜', '乐秀路', '临洮路', '嘉怡路', '定边路', '真新新村', '真光路', '铜川路', '真如', '花桥', '桂林路', '漕河泾开发区', '合川路', '星中路', '七宝', '中春路', '九亭', '泗泾', '佘山', '洞泾', '松江大学城', '文汇路', '明中路', '徐盈路', '徐泾北城', '九号线', '中科路', '郭守敬纪念馆', '张江软件园', '东靖路', '五洲大道', '新苗', '杨高北路', '金桥', '隆德路', '张江路', '龙阳路', '世纪大道', '源深体育中心', '民生路', '北洋泾路', '德平路', '云山路', '金桥路', '博兴路', '五莲路', '巨峰路'] },
    { id: '15', name: '15号线', color: '#1E5B9A', stations: ['顾村公园', '南翔', '姚虹路', '翔殷路', '黄兴公园', '延吉中路', '黄兴路', '江浦路', '鞍山新村', '四平路', '曲阳路', '虹口足球场', '赤峰路', '大柏树', '江湾镇', '殷高西路', '三门路', '江湾体育场', '五角场', '国权路', '同济大学', '四平路', '邮电新村', '海伦路', '四川北路', '天潼路', '南京东路', '豫园', '老西门', '新天地', '陕西南路', '上海图书馆', '交通大学', '虹桥路', '宋园路', '伊犁路', '水城路', '龙溪路', '龙柏新村', '紫藤路', '航中路', '紫竹高新区', '永德路', '云山路', '德平路', '北洋泾路', '民生路', '源深体育中心', '世纪大道', '浦电路', '蓝村路', '上海儿童医学中心', '临沂新村', '高科西路', '东明路', '高青路', '华夏西路', '上南路', '灵岩南路', '东方体育中心'] },
    { id: '16', name: '16号线', color: '#E60012', stations: ['龙阳路', '华夏中路', '罗山路', '周浦东', '鹤沙航城', '航头东', '新场', '野生动物园', '惠南', '惠南东', '书院', '临港大道', '滴水湖', '临港新城', '申港大道', '芦潮港', '浦东足球场', '成山路', '杨思', '东方体育中心', '灵岩南路', '上南路', '华夏西路', '高青路', '东明路', '高科西路', '临沂新村', '上海儿童医学中心', '蓝村路', '浦电路', '世纪大道', '源深体育中心', '民生路', '北洋泾路', '德平路', '云山路', '金桥路', '博兴路', '五莲路', '巨峰路', '东靖路', '五洲大道', '洲海路', '外高桥保税区南', '航津路', '外高桥保税区北', '港城路'] },
    { id: '17', name: '17号线', color: '#F9E700', stations: ['西岑', '南翔', '罗店', '美罗公路', '陈翔公路', '鹤北路', '赵巷', '嘉定新城', '马陆', '武威路', '祁连山南路', '金泽路', '蟠龙路', '徐梅南路', '银都路', '锦秋路', '颛桥', '北桥', '剑川路', '东川路', '金平路', '华宁路', '文井路', '闵行开发区', '浦江镇', '江月路', '联航路', '沈杜公路'] },
    { id: '18', name: '18号线', color: '#4A90E2', stations: ['长江南路', '殷高西路', '江湾镇', '大柏树', '赤峰路', '虹口足球场', '东宝兴路', '宝山路', '上海火车站', '中山北路', '延长路', '上海马戏城', '汶水路', '彭浦新村', '共康路', '通河新村', '呼兰路', '共富新村', '宝安公路', '友谊西路', '富锦路', '南翔', '姚虹路', '翔殷路', '黄兴公园', '延吉中路', '黄兴路', '江浦路', '鞍山新村', '四平路', '曲阳路'] },
  ],
  广州: [
    { id: '1', name: '1号线', color: '#F3E600', stations: ['西塱', '坑口', '花地湾', '芳村', '黄沙', '长寿路', '陈家祠', '西门口', '公园前', '农讲所', '烈士陵园', '东山口', '杨箕', '体育西路', '体育中心', '广州东站'] },
    { id: '2', name: '2号线', color: '#004B87', stations: ['广州南站', '石壁', '会江', '南浦', '洛溪', '南洲', '东晓南', '江夏', '萧岗', '白云文化广场', '白云公园', '飞翔公园', '三元里', '广州火车站', '越秀公园', '纪念堂', '公园前', '海珠广场', '市二宫', '江南西', '昌岗', '江泰路', '东晓南', '南洲', '洛溪', '南浦', '会江', '石壁', '广州南站'] },
    { id: '3', name: '3号线', color: '#FF7F00', stations: ['番禺广场', '市桥', '汉溪长隆', '大石', '厦滘', '沥滘', '大塘', '客村', '广州塔', '珠江新城', '体育西路', '纪念堂', '梅花园', '京溪南方医院', '同和', '白云公园', '永泰', '同德', '高增', '人和', '龙归', '嘉禾望岗', '白云大道北', '永平', '夏茅', '潖江', '白江', '神舟路', '航天奇观', '大观南路'] },
    { id: '4', name: '4号线', color: '#228B22', stations: ['黄村', '车陂', '车陂南', '万胜围', '官洲', '大学城北', '大学城南', '新造', '石碁', '海傍', '低涌', '东涌', '黄阁汽车城', '黄阁', '蕉门', '金洲', '镇龙', '镇龙西', '南沙客运港', '千年塔公园', '金融高新区', '双岗', '南横', '塘坑', '大涌', '广隆', '飞沙角', '广花路', '花地湾', '花地大道', '黄沙', '沙园', '沙河顶', '天河客运站', '五山', '华师', '岗顶', '石牌桥', '体育西路', '珠江新城', '广州塔', '客村', '大塘', '沥滘', '厦滘', '大石', '汉溪长隆', '市桥', '番禺广场'] },
    { id: '5', name: '5号线', color: '#FF69B4', stations: ['滘口', '坦尾', '中山八', '西场', '西村', '江南西', '杨箕', '动物园', '五羊邨', '珠江新城', '猎德', '潭村', '员村', '科韵路', '车陂南', '东圃', '三溪', '鱼珠', '大沙地', '大沙东', '文冲', '钟落潭', '燕岗'] },
    { id: '6', name: '6号线', color: '#8B4513', stations: ['浔峰岗', '横沙', '沙贝', '河沙', '坦尾', '如意坊', '黄沙', '文化公园', '一德路', '海珠广场', '北京路', '黄花岗', '区庄', '东湖', '东山口', '梅花园', '沙河顶', '天河客运站', '长湴', '植物园', '龙洞', '柯木塱', '高塘石', '黄陂', '金峰', '暹岗', '苏元', '萝岗', '香雪'] },
    { id: '7', name: '7号线', color: '#9370DB', stations: ['广州南站', '石壁', '谢村', '钟村', '汉溪长隆', '南村万博', '员岗', '板桥', '大学城南', '大学城北', '深井', '长洲', '洪德', '沙太南', '沙贝', '横沙', '浔峰岗'] },
    { id: '8', name: '8号线', color: '#00CED1', stations: ['凤凰新村', '沙园', '宝岗大道', '昌岗', '晓港', '中大', '鹭江', '客村', '赤岗', '磨碟沙', '新港东', '琶洲', '万胜围', '岑村', 'eq', '同德', '上步', '聚龙', '石井', '小坪', '石潭', '石门', '天河公园', '体育西路', '纪念堂', '越秀公园', '广州火车站', '西村', '西场', '中山八', '坦尾', '河沙', '沙贝', '横沙', '浔峰岗'] },
    { id: '9', name: '9号线', color: '#DC143C', stations: ['飞鹅岭', '花都广场', '花果山公园', '花城广场', '马鞍山公园', '莲塘', '清㘵', '清塘', '高增', '高增', '清㘵', '清塘', '莲塘', '马鞍山公园', '花城广场', '花果山公园', '花都广场', '飞鹅岭'] },
    { id: '13', name: '13号线', color: '#FFD700', stations: ['鱼珠', '裕丰围', '双岗', '南海神庙', '夏园', '南岗', '沙村', '白江', '白塱', '石楼', '新塘', '官湖', '新沙', '镇龙北', '镇龙', '中新', '坑贝', '凤岗', '朱村', '山田', '白云机场北', '人和', '高增', '机场南', '花都广场', '花果山公园', '花城广场', '马鞍山公园', '莲塘', '清㘵', '清塘'] },
    { id: '14', name: '14号线', color: '#FF6347', stations: ['嘉禾望岗', '白云大道北', '江高', '高塘石', '柯木塱', '龙洞', '植物园', '长湴', '天河客运站', '沙河顶', '梅花园', '东山口', '区庄', '黄花岗', '北京路', '海珠广场', '一德路', '文化公园', '黄沙', '如意坊', '坦尾', '河沙', '沙贝', '横沙', '浔峰岗'] },
    { id: '18', name: '18号线', color: '#8FC31F', stations: ['万顷沙', '横沥', '南涌', '浔峰岗', '横沙', '沙贝', '河沙', '坦尾', '如意坊', '黄沙', '文化公园', '一德路', '海珠广场', '北京路', '黄花岗', '区庄', '东山口', '梅花园', '沙河顶', '天河客运站', '长湴', '植物园', '龙洞', '柯木塱', '高塘石', '江高', '白云大道北', '嘉禾望岗', '龙归', '人和', '机场南', '白云机场北', '山田', '朱村', '凤岗', '坑贝', '中新', '镇龙', '镇龙北', '新沙', '官湖', '新塘', '石楼', '白塱', '白江', '沙村', '南岗', '夏园', '南海神庙', '双岗', '裕丰围', '鱼珠'] },
    { id: '21', name: '21号线', color: '#1E5B9A', stations: ['员村', '天河公园', '棠下村', '体育西路', '珠江新城', '广州塔', '客村', '鹭江', '中大', '晓港', '昌岗', '宝岗大道', '沙园', '凤凰新村', '石潭', '石门', '天河公园', '棠下村', '体育西路', '珠江新城', '广州塔', '客村', '鹭江', '中大', '晓港', '昌岗', '宝岗大道', '沙园', '凤凰新村'] },
  ],
  杭州: [
    { id: '1', name: '1号线', color: '#E4002B', stations: ['湘湖', '滨康路', '西兴', '滨和路', '江陵路', '近江', '婺江路', '城站', '定安路', '龙翔桥', '凤起路', '武林广场', '西湖文化广场', '打铁关', '闸弄口', '火车东站', '彭埠', '七堡', '九和路', '九堡', '临平', '南苑', '余杭高铁站', '乔司南', '乔司', '翁梅', '余杭广场', '许村', '良渚', '文一西路', '文海南路', '文三路', '武林门', '沈塘桥', '下沙西', '金沙湖', '高沙路', '壹号大街'] },
    { id: '2', name: '2号线', color: '#004B87', stations: ['良渚', '杜甫村', '文一西路', '文海南路', '文三路', '武林门', '沈塘桥', '下沙西', '金沙湖', '高沙路', '壹号大街', '三墩', '虾龙圩', '三里亭', '红普桥', '人民路', '杭发厂', '人民广场', '建设路', '庆春广场', '中河北路', '凤起路', '武林广场', '西湖文化广场', '打铁关', '闸弄口', '火车东站', '彭埠', '七堡', '九和路', '九堡', '临平', '南苑', '余杭高铁站', '乔司南', '乔司', '翁梅', '余杭广场', '许村'] },
    { id: '4', name: '4号线', color: '#008C95', stations: ['浦沿', '潘水', '钟家村', '新风', '池华街', '人民路', '杭发厂', '人民广场', '建设路', '庆春广场', '中河北路', '凤起路', '武林广场', '西湖文化广场', '打铁关', '闸弄口', '火车东站', '彭埠', '七堡', '九和路', '九堡', '临平', '南苑', '余杭高铁站', '乔司南', '乔司', '翁梅', '余杭广场', '许村', '良渚', '杜甫村', '文一西路', '文海南路', '文三路', '武林门', '沈塘桥', '下沙西', '金沙湖', '高沙路', '壹号大街', '三墩', '虾龙圩', '三里亭', '红普桥'] },
    { id: '5', name: '5号线', color: '#A0004C', stations: ['姑娘桥', '三坝', '联庄', '杭师大仓前', '仓前', '江城路', '城站', '婺江路', '近江', '江陵路', '滨和路', '西兴', '滨康路', '湘湖', '建设三路', '建设一路', '创景路', '创嘉路', '创乐路', '创智路', '绿汀路', '江南大道', '杭师大仓前', '仓前', '江城路', '城站', '婺江路', '近江', '江陵路', '滨和路', '西兴', '滨康路', '湘湖'] },
    { id: '6', name: '6号线', color: '#B35A20', stations: ['桂花西路', '白洋', '杜甫村', '良渚', '许村', '余杭广场', '翁梅', '乔司', '乔司南', '余杭高铁站', '南苑', '临平', '九堡', '九和路', '七堡', '彭埠', '火车东站', '闸弄口', '打铁关', '西湖文化广场', '武林广场', '凤起路', '中河北路', '庆春广场', '建设路', '人民广场', '杭发厂', '人民路', '池华街', '新风', '钟家村', '潘水', '浦沿'] },
    { id: '7', name: '7号线', color: '#F2C172', stations: ['吴山广场', '市民中心', '江城路', '近江', '江陵路', '滨和路', '西兴', '滨康路', '湘湖', '建设三路', '建设一路', '创景路', '创嘉路', '创乐路', '创智路', '绿汀路', '江南大道', '云会路', '云河路', '江和路', '杭师大仓前', '仓前', '城站', '婺江路', '凤起路', '中河北路', '庆春广场', '建设路', '人民广场', '杭发厂', '人民路', '池华街', '新风', '钟家村', '潘水', '浦沿'] },
    { id: '9', name: '9号线', color: '#8FC31F', stations: ['观音塘', '复兴路', '市民中心', '吴山广场', '武林广场', '凤起路', '中河北路', '庆春广场', '建设路', '人民广场', '杭发厂', '人民路', '池华街', '新风', '钟家村', '潘水', '浦沿', '白洋', '桂花西路'] },
    { id: '10', name: '10号线', color: '#009BC0', stations: ['翠柏里', '三坝', '姑娘桥', '黄龙体育中心', '黄龙洞', '浙大紫金港', '浙大玉泉', '浙大西溪', '文一西路', '文海南路', '文三路', '武林门', '沈塘桥', '下沙西', '金沙湖', '高沙路', '壹号大街', '三墩', '虾龙圩', '三里亭', '红普桥', '人民路', '杭发厂', '人民广场', '建设路', '庆春广场', '中河北路', '凤起路', '武林广场', '西湖文化广场', '打铁关', '闸弄口', '火车东站', '彭埠', '七堡', '九和路', '九堡', '临平', '南苑', '余杭高铁站', '乔司南', '乔司', '翁梅', '余杭广场', '许村', '良渚', '杜甫村'] },
  ]
};

// 默认城市
const DEFAULT_CITY = '深圳';

// 根据城市获取地铁线路
const getSubwayLines = (city: string) => {
  return subwayData[city] || subwayData[DEFAULT_CITY];
};

// 获取站点坐标（根据当前城市）
const getStationPosition = (stationName: string, currentCity: string = '北京') => {
  const cityStationsData = cityStations[currentCity] || cityStations['北京'];
  return cityStationsData[stationName] || { lng: 116.3974, lat: 39.9093 }; // 默认坐标
};

// 根据站点列表生成路径坐标
const generatePathFromStations = (stations: string[], currentCity: string = '北京') => {
  return stations.map(station => getStationPosition(station, currentCity)).filter(pos => pos.lng && pos.lat);
};

// 站点信息
interface StationInfo {
  name: string;
  line: string;
  transfers: string[];
  facilities: string[];
}

interface SubwayQueryModalProps {
  visible: boolean;
  onClose: () => void;
}

const SubwayQueryModal: React.FC<SubwayQueryModalProps> = ({ visible, onClose }) => {
  const [selectedLine, setSelectedLine] = useState<string>('');
  const [startStation, setStartStation] = useState<string>('');
  const [endStation, setEndStation] = useState<string>('');
  const [routeResult, setRouteResult] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<StationInfo | null>(null);
  const [routePath, setRoutePath] = useState<any[]>([]); // 路线路径数据
  const [startPosition, setStartPosition] = useState<any>(null); // 起点坐标
  const [endPosition, setEndPosition] = useState<any>(null); // 终点坐标
  const [currentCity, setCurrentCity] = useState<string>('北京');
  const [cityLoading, setCityLoading] = useState<boolean>(false);
  const [showRouteOnMap, setShowRouteOnMap] = useState<boolean>(false); // 控制地图是否显示路线

  // 获取用户位置和城市
  const getCurrentLocation = async () => {
    setCityLoading(true);
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });

        const { latitude, longitude } = position.coords;

        // 使用高德地图逆地理编码获取城市信息
        if ((window as any).AMap) {
          const AMap = (window as any).AMap;
          const geocoder = new AMap.Geocoder();

          try {
            const result = await new Promise<any>((resolve, reject) => {
              geocoder.getAddress([longitude, latitude], (status: string, result: any) => {
                if (status === 'complete' && result.info === 'OK') {
                  resolve(result);
                } else {
                  // 逆地理编码失败时使用默认值，不阻塞功能
                  console.warn('逆地理编码失败，使用默认城市:', result?.info);
                  resolve(null);
                }
              });
            });

            if (result?.regeocode?.addressComponent) {
              const city = result.regeocode.addressComponent.city || 
                          result.regeocode.addressComponent.province;
              setCurrentCity(city);
              console.log('📍 定位成功，当前城市:', city);
            }
          } catch (geocodeError) {
            console.warn('逆地理编码出错，使用默认城市:', geocodeError);
          }
        }
      } else {
        console.warn('浏览器不支持地理定位');
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      // 保持默认城市
    } finally {
      setCityLoading(false);
    }
  };

  // 组件挂载时获取位置
  useEffect(() => {
    if (visible && (window as any).AMap) {
      console.log('📍 SubwayQueryModal: 开始获取位置...');
      getCurrentLocation();
    } else if (visible && !(window as any).AMap) {
      console.log('📍 SubwayQueryModal: 等待AMap加载...');
      // 等待AMap加载完成后获取位置
      const checkAMap = setInterval(() => {
        if ((window as any).AMap) {
          clearInterval(checkAMap);
          console.log('📍 SubwayQueryModal: AMap已加载，开始获取位置...');
          getCurrentLocation();
        }
      }, 500);
    }
  }, [visible]);

  // 组件卸载时清理状态
  useEffect(() => {
    return () => {
      // 清理路线状态
      setRouteResult(null);
      setRoutePath([]);
      setStartPosition(null);
      setEndPosition(null);
      setShowRouteOnMap(false);
      console.log('🧹 SubwayQueryModal: 组件卸载，已清理路线状态');
    };
  }, []);

  // 获取当前城市的地铁线路
  const currentCityLines = getSubwayLines(currentCity);

  // 获取当前选中线路的站点
  const currentLineStations = currentCityLines.find(line => line.id === selectedLine)?.stations || [];

  // 模拟路线查询
  const handleSearch = () => {
    if (!startStation || !endStation) {
      console.warn('请先选择起点和终点');
      return;
    }

    if (startStation === endStation) {
      console.warn('起点和终点不能相同');
      return;
    }

    console.log('🔍 开始路线查询:', { startStation, endStation, currentCity });

    // 先清除之前的路线显示
    setShowRouteOnMap(false);

    // 查找起点和终点所在的线路
    let startLine = '';
    let endLine = '';
    let startLineData: any = null;
    let endLineData: any = null;

    // 遍历所有线路，查找站点
    for (const line of currentCityLines) {
      if (line.stations.includes(startStation)) {
        startLine = line.name;
        startLineData = line;
      }
      if (line.stations.includes(endStation)) {
        endLine = line.name;
        endLineData = line;
      }
    }

    console.log('📍 站点分析:', { startLine, endLine, startLineData: !!startLineData, endLineData: !!endLineData });

    // 计算路线（基于实际站点坐标）
    let mockRoute: any;
    let mockPath: any[];

    if (startLine === endLine && startLineData) {
      // 同一条线路 - 使用实际站点坐标
      const startIndex = startLineData.stations.indexOf(startStation);
      const endIndex = startLineData.stations.indexOf(endStation);
      const isForward = startIndex < endIndex;

      const stations = isForward
        ? startLineData.stations.slice(startIndex, endIndex + 1)
        : startLineData.stations.slice(endIndex, startIndex + 1).reverse();

      mockRoute = {
        distance: `${Math.abs(endIndex - startIndex) * 2.5}km`,
        duration: `${Math.abs(endIndex - startIndex) * 3}分钟`,
        transfers: 0,
        steps: [{
          line: startLine,
          direction: isForward ? `往${startLineData.stations[startLineData.stations.length - 1]}方向` : `往${startLineData.stations[0]}方向`,
          stations: stations
        }]
      };

      // 使用实际站点坐标生成路径
      mockPath = generatePathFromStations(stations, currentCity);

    } else {
      // 不同线路 - 需要换乘，寻找合适的换乘站
      // 简化处理：假设在雍和宫换乘（实际应该计算最优换乘点）
      const transferStation = '雍和宫'; // 假设的换乘站

      // 起点线路路径
      const startLineStations = startLineData ? [startStation, transferStation] : [startStation, transferStation];
      // 终点线路路径
      const endLineStations = endLineData ? [transferStation, endStation] : [transferStation, endStation];

      mockRoute = {
        distance: '18.5km',
        duration: '45分钟',
        transfers: 1,
        steps: [
          { line: startLine || '起始线路', direction: `往${transferStation}方向`, stations: startLineStations },
          { transfer: `${transferStation}换乘`, line: endLine || '目标线路', direction: `往${endStation}方向`, stations: endLineStations }
        ]
      };

      // 生成包含换乘的路径坐标
      const startPath = generatePathFromStations(startLineStations, currentCity);
      const endPath = generatePathFromStations(endLineStations, currentCity);

      // 合并路径（去重换乘站）
      mockPath = [...startPath, ...endPath.slice(1)];
    }

    // 获取起点和终点的实际坐标
    const startPos = getStationPosition(startStation, currentCity);
    const endPos = getStationPosition(endStation, currentCity);

    setRouteResult(mockRoute);
    setRoutePath(mockPath);
    setStartPosition(startPos);
    setEndPosition(endPos);
    setShowRouteOnMap(true); // 显示路线在地图上
    console.log('✅ 路线查询完成:', mockRoute);
    console.log('📍 起点坐标:', startPos, '终点坐标:', endPos);
  };

  // 交换起点和终点
  const handleSwapStations = () => {
    const temp = startStation;
    setStartStation(endStation);
    setEndStation(temp);
  };

  // 选择站点 - 智能填充起点或终点
  const handleStationSelect = (stationName: string) => {
    // 如果起点为空，填入起点；否则填入终点
    if (!startStation) {
      setStartStation(stationName);
      console.log('📍 已将站点填充到起点:', stationName);
    } else if (!endStation) {
      setEndStation(stationName);
      console.log('📍 已将站点填充到终点:', stationName);
    } else {
      // 如果起点和终点都有数据，替换终点
      setEndStation(stationName);
      console.log('📍 已替换终点为:', stationName);
    }

    // 更新选中站点信息用于显示
    const stationInfo: StationInfo = {
      name: stationName,
      line: selectedLine ? currentCityLines.find((l: any) => l.id === selectedLine)?.name || '' : '',
      transfers: ['1号线', '2号线'], // 模拟换乘信息
      facilities: ['卫生间', '便利店', '自动售货机']
    };
    setSelectedStation(stationInfo);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onClose}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>地铁查询系统</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                当前城市：{currentCity} {cityLoading && <span>(定位中...)</span>}
              </Text>
            </div>
          </Space>
          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            onClick={getCurrentLocation}
            loading={cityLoading}
          >
            定位
          </Button>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 1400 }}
      styles={{ body: { height: '80vh', padding: 0 } }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 搜索区域 */}
        <Card size="small" style={{ marginBottom: 8 }}>
          <Row gutter={8} align="middle">
            <Col span={7}>
              <Input
                placeholder="请输入起点站"
                value={startStation}
                onChange={(e) => setStartStation(e.target.value)}
                prefix="起点："
              />
            </Col>
            <Col span={2}>
              <Button
                icon={<SwapOutlined />}
                onClick={handleSwapStations}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={7}>
              <Input
                placeholder="请输入终点站"
                value={endStation}
                onChange={(e) => setEndStation(e.target.value)}
                prefix="终点："
              />
            </Col>
            <Col span={4}>
              <Space.Compact style={{ width: '100%' }}>
                <Button
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  type="primary"
                >
                  查询
                </Button>
                <Button
                  onClick={() => {
                    setRouteResult(null);
                    setRoutePath([]);
                    setStartPosition(null);
                    setEndPosition(null);
                    setShowRouteOnMap(false); // 隐藏地图上的路线
                    console.log('🧹 已清除路线');
                  }}
                >
                  清除
                </Button>
              </Space.Compact>
            </Col>
          </Row>
        </Card>

        {/* 线路选择 */}
        <Card size="small" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {currentCityLines.map(line => (
              <Button
                key={line.id}
                type={selectedLine === line.id ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedLine(line.id)}
                style={{
                  backgroundColor: selectedLine === line.id ? line.color : undefined,
                  borderColor: line.color,
                  color: selectedLine === line.id ? 'white' : line.color
                }}
              >
                {line.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* 主体内容区域 */}
        <div style={{ flex: 1, display: 'flex', gap: 8 }}>
          {/* 左侧：路线详情面板 */}
          <Card
            size="small"
            title="路线详情"
            style={{ width: 300, flexShrink: 0 }}
          >
            {routeResult ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>距离：</Text><Text>{routeResult.distance}</Text><br />
                  <Text strong>时间：</Text><Text>{routeResult.duration}</Text><br />
                  <Text strong>换乘：</Text><Text>{routeResult.transfers}次</Text>
                </div>
                <Divider />
                <div>
                  {routeResult.steps.map((step: any, index: number) => (
                    <div key={index} style={{ marginBottom: 12 }}>
                      {step.transfer ? (
                        <Tag color="orange">{step.transfer}</Tag>
                      ) : (
                        <div>
                          <Tag color="blue">{step.line}</Tag>
                          <Text style={{ marginLeft: 8 }}>{step.direction}</Text>
                          <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                            {step.stations.join(' → ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Text type="secondary">请先查询路线</Text>
            )}
          </Card>

          {/* 中间：地图显示区域 */}
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ height: 400 }}>
              <MapContainer
                center={{ lng: 116.3974, lat: 39.9093 }}
                zoom={10}
                mapType="normal"
                showSubway={true}
                routePath={routePath}
                routeVisible={showRouteOnMap}
                startPosition={startPosition}
                endPosition={endPosition}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </Card>

          {/* 右侧：站点信息面板 */}
          <Card
            size="small"
            title="站点信息"
            style={{ width: 300, flexShrink: 0 }}
          >
            {selectedLine && currentLineStations.length > 0 ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>当前线路：</Text>
                  <Tag color={currentCityLines.find(l => l.id === selectedLine)?.color}>
                    {currentCityLines.find(l => l.id === selectedLine)?.name}
                  </Tag>
                </div>
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  <List
                    size="small"
                    dataSource={currentLineStations}
                    renderItem={(station, index) => (
                      <List.Item
                        style={{
                          cursor: 'pointer',
                          padding: '8px',
                          backgroundColor: selectedStation?.name === station ? '#f0f8ff' : 'transparent',
                          borderRadius: '4px',
                          border: selectedStation?.name === station ? '1px solid #1890ff' : '1px solid transparent',
                          marginBottom: '4px'
                        }}
                        onClick={() => handleStationSelect(station as string)}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>{index + 1}. {station as string}</Text>
                            <Text style={{ fontSize: '12px', color: '#999' }}>
                              点击{!startStation ? '设为起点' : !endStation ? '设为终点' : '替换终点'}
                            </Text>
                          </div>
                          {selectedStation?.name === station && selectedStation && (
                            <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                              <div>🚇 换乘：{selectedStation.transfers.join('、')}</div>
                              <div>🏪 设施：{selectedStation.facilities.join('、')}</div>
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            ) : (
              <Text type="secondary">请选择地铁线路</Text>
            )}
          </Card>
        </div>
      </div>
    </Modal>
  );
};

export default SubwayQueryModal;
