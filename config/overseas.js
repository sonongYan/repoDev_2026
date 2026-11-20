// 海外注册地 → 官方注册机构查询入口。
// 用于公司尽调：Bing 线索判定为境外主体后，路由到对应司法管辖区的官方注册处查询。
// free: 该注册地是否提供免费的公司基本资料在线查询（结构化数据可尝试抓取）；
//       收费/需登录/仅证书验证的渠道，返回官方入口供人工核验。

const OVERSEAS_REGISTRIES = {
  HK: {
    name: '中国香港',
    keywords: ['香港', 'hong kong', 'hk '],
    domains: ['icris.cr.gov.hk', 'cr.gov.hk'],
    official: {
      name: '香港公司注册处 综合资讯系统（ICRIS）',
      homepage: 'http://www.icris.cr.gov.hk/preDown.html',
      searchUrl: 'http://www.icris.cr.gov.hk/csci/',
      free: false,
      notes: '网上查册中心：公司基本资料免费，详细资料/文件查册收费（HKD）。需接受查询条款并输入验证码。',
    },
  },

  TW: {
    name: '中国台湾地区',
    keywords: ['台湾', 'taiwan', '臺灣'],
    domains: ['gcis.nat.gov.tw', 'findbiz.nat.gov.tw'],
    official: {
      name: '经济部商业司 商工登记公示系统（gcis.nat.gov.tw）',
      homepage: 'http://gcis.nat.gov.tw',
      searchUrl: 'https://findbiz.nat.gov.tw/fts/query/QueryList/queryList.do?qType=0&qVal={name}',
      free: true,
      notes: '公司/分公司/商号登记公示免费查询，支持按名称/统一编号检索。',
    },
  },

  BVI: {
    name: '英属维尔京群岛',
    keywords: ['bvi', 'british virgin islands', '英属维尔京'],
    domains: ['bvifsc.vg', 'bvicaribbean.com'],
    official: {
      name: '英属维尔京金融服务委员会（BVIFSC）',
      homepage: 'http://www.bvifsc.vg/en-gb/divisions/registryofcorporateaffairs/certificateverification.aspx?qrcode=1533042',
      searchUrl: 'http://www.bvifsc.vg/en-gb/divisions/registryofcorporateaffairs/certificateverification.aspx',
      free: true,
      notes: '仅支持按证书二维码/编号验证（无法按公司名检索）；名称注册状态可经 BVICaribbean（bvicaribbean.com）查询。',
    },
  },

  SG: {
    name: '新加坡',
    keywords: ['singapore', '新加坡', ' acra '],
    domains: ['acra.gov.sg'],
    official: {
      name: '新加坡会计与企业管理局（ACRA）',
      homepage: 'https://www.acra.gov.sg/Home/',
      searchUrl: 'https://www.acra.gov.sg/home/',
      free: true,
      notes: 'BizFile+ 可免费查公司基本资料（名称/注册号/状态/注册地址），详细文件需付费。',
    },
  },
};

module.exports = { OVERSEAS_REGISTRIES };
