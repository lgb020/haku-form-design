//公共函数库
import * as common from '@/tools/common';
import { pageFilter, Breadcrumb, UserInfo, PagePagination } from "@/@types/basic.d";
//全局枚举
// import '@/config/enum';
import { Vue } from 'vue-property-decorator';
import { Pagination } from 'ant-design-vue';
import Axios from 'axios';

// Vue实例类型添加
declare module 'vue/types/vue' {
    interface VueConstructor {
        /** 当前组件权限 */
        permission: string | Array<string> | Function;
    }

    /** 系统级配置 */
    interface SysConfig {
        /** 系统标题 */
        TITLE: string,
        /** 接口 */
        INTERFACE: string,
        /** 默认用户名 */
        Default_username: string,
        /** 默认密码 */
        Default_password: string,
        /** 权限接口 */
        Permission_interface: string
    }

    interface Vue {
        /** 公共函数库 */
        $common: typeof common;
        $axios: typeof Axios;
        /** 全局枚举 */
        // $emum: typeof sysEnum;
        /** EventBus */
        $bus: Vue;
        /** 系统级配置 */
        $config: SysConfig;
        /** 当前组件权限 */
        permission: string | Array<string> | Function;

        
        /** [root]面包屑 */
        breadcrumbSource: Array<Breadcrumb>;
        /** [root]设置面包屑 */
        setBreadcrumb(arr: Array<Breadcrumb | string>): void;
        /** [root]获取分页器默认参数 */
        getPagination(config?: object): PagePagination;
    }
}