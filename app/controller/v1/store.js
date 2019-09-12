'use strict';

const BaseController = require('../base');
const updateAddons = require('../../../script/commands/update-addons');
const _ = require('lodash');
const utils = require('../../utils/utils');

class StoreController extends BaseController {
  /*
   * html - 应用列表
   * @params: string uid
   * @return: object { token }
   */
  async index() {
    const self = this;
    const { app, ctx, service } = this;
    const query = ctx.query;

    const data = {
      app_list: [],
      all_data: null,
    };

    console.log('query:%j', query);
    const params = {
      out_url: 'appList',
      method: 'GET',
      data: query,
    };
    console.log('params:%j', params);
    const appRes = await service.outapi.api(params);

    if (appRes.code === CODE.SUCCESS) {
      // 列表数据处理
      const tmpAppList = appRes.data.list.data;
      // console.log('tmpAppList:%j', tmpAppList);
      if (!_.isEmpty(tmpAppList)) {
        for (let i = 0; i < tmpAppList.length; i++) {
          const one = tmpAppList[i];
          one.is_install = false;
          // one.is_running = false;
          // one.is_new_version = false;

          // 检查是否安装
          const installRes = service.store.appIsInstall(one.appid);
          if (installRes) {
            one.is_install = true;
          }
        }
      }

      data.app_list = appRes.data.list.data;
      // 所有数据
      data.all_data = appRes.data.list;
    }

    await ctx.render('store/index.ejs', data);
  }

  /*
   * html - 我的应用
   * @params: string uid
   * @return: object { token }
   */
  async myApp() {
    const self = this;
    const { app, ctx, service } = this;
    const query = ctx.query;
    const page = Number(query.page) > 1 ? Number(query.page) : 1;

    const data = {
      app_list: [],
      all_data: {
        total: 0,
        current_page: page,
        last_page: 1,
      },
    };

    const appList = await service.store.myAppList(page);
    // console.log(appList);

    if (!_.isEmpty(appList)) {
      // 列表数据处理
      if (!_.isEmpty(appList)) {
        for (let i = 0; i < appList.length; i++) {
          const one = appList[i];
          one.is_running = false;
          one.is_new_version = false;

          // 是否启动
          const runRes = await service.store.appIsRunning(one.appid);
          if (runRes) {
            one.is_running = true;
          }

          // 是否有更新
          const newVersionRes = await service.store.appHasNewVersion(
            one.appid,
            one.version
          );
          if (newVersionRes) {
            one.is_new_version = true;
          }
        }
      }
      // console.log(appList);
      data.app_list = appList;
    }

    // 总数目
    const total = await service.store.myAppTotal();
    data.all_data.total = total;

    await ctx.render('store/myapp.ejs', data);
  }

  /*
   * api - APP安装
   * @params: string uid
   * @return: object { token }
   */
  async appInstall() {
    const self = this;
    const { app, ctx, service } = this;
    const appid = 'redis';
    const params = {
      appid: 'redis',
    };
    const data = {};
    self.sendSuccess(data, '正在安装中，请稍后刷新...');
  }

  /*
   * api - APP卸载
   * @params: string uid
   * @return: object { token }
   */
  async appUninstall() {
    const self = this;
    const { app, ctx, service } = this;
    const query = ctx.query;
    const appid = query.appid;

    const delRes = service.store.uninstallApp(appid);
    if (delRes.code !== CODE.SUCCESS) {
      self.sendFail({}, delRes.msg, CODE.SYS_OPERATION_FAILED);
      return;
    }

    const data = {};
    self.sendSuccess(data, '卸载成功');
  }
}

module.exports = StoreController;
