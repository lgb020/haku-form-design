import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { notification, message } from 'ant-design-vue';
import { cloneLoop } from "@/lib/clone";

/** 全局Assembly */
export const enum AssemblyResources {
    /** 解析MD5 */
    md5 = 'md5'
}

export function getToken(): string {
    return 'Bearer ' + localStorage.getItem('Authorization');
};

/** 生成随机组件Id */
export function createModelId(len = 36) {
    let s: Array<string> = [];
    let hexDigits = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < len; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    // @ts-ignore
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    // s[8] = s[13] = s[18] = s[23] = "-";
 
    let uuid = s.join("");
    return uuid;
}

/**
 * 日期格式化
 * @param {Date} [date=new Date()] 日期
 * @param {string} [fmt='yyyy-MM-dd'] 格式化参数
 * @return {string} 格式化后的日期
 */
export function dateFormat(date: Date = new Date(), fmt: string = "yyyy-MM-dd"):string {
    if (!date) return "";
    let o:object = {
        "M+" : date.getMonth()+1,                 //月份
        "d+" : date.getDate(),                    //日
        "H+" : date.getHours(),                   //小时
        "m+" : date.getMinutes(),                 //分
        "s+" : date.getSeconds(),                 //秒
        "q+" : Math.floor((date.getMonth()+3)/3), //季度
        "S"  : date.getMilliseconds()             //毫秒
    };
    let _fmt = fmt;
    if(/(y+)/.test(fmt))
        _fmt = _fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(let k in o)
        if(new RegExp("("+ k +")").test(_fmt))
            _fmt = _fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return _fmt;
};

Date.prototype.format = function(fmt = 'yyyy-MM-dd') {
    return dateFormat(this, fmt);
}

/** 交互数组中两段数值的位置 */
export function arrChange(arr: Array<any>, num1: number, num2: number, num1length: number = 1, num2length: number = 1) {
    if(num1 > num2) [num1, num2, num1length, num2length] = [num2, num1, num2length, num1length];

    return arr.slice(0, num1)
        .concat(arr.slice(num2, num2 + num2length))
        .concat(arr.slice(num1 + num1length, num2))
        .concat(arr.slice(num1, num1 + num1length))
        .concat(arr.slice(num2 + num2length));
}

/** 移动组件树中某一项的位置 */
export function moveNodeOfTree(
    tree: Array<any>, 
    id: string | number, 
    pid: string | number, 
    insertSlotIndex?: number, 
    prop: string = 'id'
) {
    let _tree = cloneLoop(tree);
    let _node = null;
    let _oldIndex = -1;
    let _orderIndex: number | undefined;

    let _isOver = false;
    const _cb = (parentNode, fn) => {
        if (parentNode?.children?.length) {
            for (let index = 0; index < parentNode.children.length; index++) {
                _isOver || _cb(parentNode.children[index], fn);
                let _re = fn(parentNode, index);
                if (_re) return;
            }
        }
    };

    _cb({ children: _tree, id: '' }, (parentNode, index): boolean => {
        if (!_isOver) {
            if (parentNode.id == '') {
                if (parentNode.children[index].id == id) {
                    _orderIndex = undefined;
                    _isOver = true;
                    return true;
                }
            } else {
                for (let i = 0; i < parentNode.children[index].length; i++) {
                    if (parentNode.children[index][i].id == id) {
                        _orderIndex = i;
                        _isOver = true;
                        return true;
                    }
                }
            }
        }
        return false;
    });

    _isOver = false;
    _cb({ children: _tree, id: '' }, (parentNode, index): boolean => {
        if (!_isOver) {
            if (_orderIndex != undefined) {
                if (parentNode.children[index][_orderIndex]?.[prop] == id) {
                    _oldIndex = index;
                    _node = parentNode.children[index][_orderIndex];
                    parentNode.children[index].splice(_orderIndex, 1);
                    _isOver = true;
                    return true;
                }
            } else if (parentNode.children[index][prop] == id) {
                _oldIndex = index;
                _node = parentNode.children[index];
                parentNode.children.splice(index, 1);
                _isOver = true;
                return true;
            }
        }
        return false;
    });

    
    if (!pid) {
        _tree.push(_node);
        return _tree;
    } else {
        _isOver = false;
        _cb({ children: _tree, id: '' }, (parentNode, index): boolean => {
            if (!_isOver) {
                if (insertSlotIndex == undefined) {
                    if (parentNode.id == '') {
                        let _insertIndex = pid ? parentNode.children.findIndex(i => i.id == pid) : parentNode.children.length;
                        parentNode.children.splice(_insertIndex, 0, _node);
                        _isOver = true;
                        return true;
                    }
                } else if (parentNode.children[index][prop] == pid && insertSlotIndex != undefined && _node) {
                    parentNode.children[index].children[insertSlotIndex].push(_node);
                    _isOver = true;
                    return true;
                }
            }
            return false;
        });
    }
    
    return _tree;
}

/** 获取LocalStorage的值 */
export function getLocalstorge(item: string): string | null {
    return window.localStorage.getItem(item) || null;
}

//Base64转Buffer
export function base64ToBuffer(b: string): Uint8Array {
    const str = atob(b);
    const buffer = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        buffer[i] = str.charCodeAt(i);
    }
    return buffer;
}

export function v(obj: any, property: string) {
    let propertys = property.split('.'),
		re = obj;
	for(let i = 0;i < propertys.length;i++) {
		if(re instanceof Array) {
			let index = Number(propertys[i]);
            re = re[index < 0 ? (re.length + index) : index];
        } else if(/.*\(.*\)/.test(propertys[i])) {
            let exp = /(.*)\((.*)\)/.exec(propertys[i]);
            if(exp !== null) {
                let _propertys = Function(`return [${exp[2]}]`)();
                re = re[exp[1]].apply(null, _propertys);
            } else {
                return re;
            }
        } else {
            if(re[propertys[i]]) re = re[propertys[i]];
            else break;
        }
		if(re === undefined || re === null) return re;
    }
	return re;
};

export function initAPI(api: object) {
    let re = {};
    const fn = (parent: any, reParent: any, url: string) => {
        if (parent) {
            Object.keys(parent).forEach((key: string) => {
                if (parent[key]) {
                    if (typeof parent[key] !== 'function') {
                        reParent[key] = {};
                        fn(parent[key], reParent[key], `${url.endsWith('/') ? (url + '/') : url}${key}`);
                    } else {
                        reParent[key] = parent[key].bind(`${url}/${key}/`);
                    }
                }
            });
        }
    };
    fn(api, re, '');
    return re;
};

let loginExpired = false;
const default_config = {

};

/**
 * Get请求
 * @param {string} url URL地址
 * @param {object} params 参数
 * @param {AxiosRequestConfig} config 
 */
export function get(url: string, params?: object, config: AxiosRequestConfig = {}):Promise<any> {
    loginExpired = false;
    return new Promise((resolve, reject) => {
        axios.get(url, {
            cancelToken: new axios.CancelToken(cancel => config.cancel = cancel),
            params: {
                ...params,
                ...default_config
            },
            ...config,
            headers: {
                Authorization: localStorage.getItem('Authorization') || '',
                ...config.headers
            },
        }).then(d => {
            if(d.data.isSuccess){
                resolve(d.data.result);
            }
            else{
                notification.error({
                    message: '[Post Error]' + url,
                    description: d.data.exception
                });
            }
        }).catch(err => {
            if(err.response && err.response.status == 401) {
                if(!loginExpired) {
                    localStorage.removeItem('Authorization');
                    // message.info('登录超时，请重新登陆。');
                    notification.warning({ message: '系统提示', description: '登录超时，请重新登陆。', });
                    loginExpired = true;
                } else {
                    setTimeout(() => { loginExpired = false; }, 1000);
                }
                reject(err);
                return;
            }
            if(err.response && err.response.data) {
                notification.error({ message: '[Get Error]' + url, description: err.response.data.errMsg, });
                console.error(err.response.data.errMsg);
            } else if(err.message) {
                notification.error({ message: '[Get Error]' + url, description: err.message, });
                console.error(err.message);
            }
            reject(err);
        })
    });
};

/**
 * Post请求
 * @param {string} url URL地址
 * @param {object} params 参数
 * @param {AxiosRequestConfig} config 
 */
export function post(url: string, params: object = {}, config: AxiosRequestConfig = {}):Promise<any> {
    return new Promise((resolve, reject) => {
        axios.post(url, {
            ...params,
            ...default_config
        }, {
            cancelToken: new axios.CancelToken(cancel => config.cancel = cancel),
            ...config,
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('Authorization') || '',
                ...config.headers
            },
        }).then(d => {
            if(d.data.isSuccess){
                resolve(d.data.result);
            }
            else{
                notification.error({
                    message: '[Post Error]' + url,
                    description: d.data.exception
                });
            }
        }).catch(err => {
            if(err.response && err.response.data) {
                notification.error({
                    message: '[Post Error]' + url,
                    description: err.response.data.errMsg || err.response.data.title,
                });
                console.error(err.response.data.errMsg);
            } else if(err.response) {
                notification.error({
                    message: '[Post Error]' + url,
                    description: err.message,
                });
                console.error(err.message);
            }
            reject(err);
        });
    });
};

/**
 * Upload请求
 * @param {string} url URL地址
 * @param {object} params 参数
 * @param {AxiosRequestConfig} config 
 */
export function upload(url: string, params: object, config: AxiosRequestConfig = {}):Promise<any> {
    return new Promise((resolve, reject) => {
        let _params = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            _params.append(key, value);
        });
        axios.post(url, _params, {
            cancelToken: new axios.CancelToken(cancel => config.cancel = cancel),
            ...config,
            headers: {
                Authorization: localStorage.getItem('Authorization') || '',
                "Content-Type": "multipart/form-data",
                ...config.headers
            },
        }).then(d => {
            resolve(d.data);
        }).catch(err => {
            if(err.response && err.response.data) {
                notification.error({
                    message: '[Upload Error]' + url,
                    description: err.response.data.errMsg || err.response.data.title,
                });
                console.error(err.response.data.errMsg);
            } else if(err.response) {
                notification.error({
                    message: '[Upload Error]' + url,
                    description: err.message,
                });
                console.error(err.message);
            }
            reject(err);
        });
    });
};

/** 获取默认的分页参数 */
export function getPagination(config: object = {}): object {
    return {
        pageSizeOptions: ['10', '20', '40'],
        showQuickJumper: true,
        showSizeChanger: true,
        defaultCurrent: 1,
        current: 1,
        defaultPageSize: 10,
        ...config
    };
}

/** 将数字插入千分位符 */
export function thousandNum(money: number | string): string {
    if(!isNaN(Number(money))) {
        return money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        throw new TypeError('添加千分位符失败，当前参数为：' + money);
    }
}

/** 获取Url参数 */
export function getParams() {
    return new URLSearchParams(location.search.replace(/\?/ig, ""));
}

function fakeClick(obj) { 
    let ev = document.createEvent("MouseEvents");
    ev.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    obj.dispatchEvent(ev);
}

/** 下载文件 */
export function downLoadFile(name: string, data: string) {
    let urlObject = window.URL || window.webkitURL || window;
    let export_blob = new Blob([data]);
    let save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
    save_link.setAttribute('href', urlObject.createObjectURL(export_blob));
    save_link.setAttribute('download', name);
    fakeClick(save_link);
}

export default {
    getToken,
    dateFormat,
    getLocalstorge,
    v,
    initAPI,
    get,
    post,
    getPagination,
    thousandNum,
    getParams,
    downLoadFile
};