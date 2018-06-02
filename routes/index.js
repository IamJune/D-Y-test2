const express = require('express');
const http = require('http');
const Crawler = require("crawler");
const co = require("co");
const cheerio = require("cheerio");

var router = express.Router();

let c = new Crawler({
    retries:1,              //超时重试次数
    retryTimeout:3000       //超时时间
});

let errorCount = 0;         //错误记录
let urlList = [];           //url 存储数组
let id = 0;                 //每条结果的标识
let contentJson = [];       //存放data相加的结果

const crawlHtml = co.wrap(function*(url){
    return new Promise((resolve,reject)=>{
        c.queue({
            url: url,                                         //目标网页url
            forceUTF8: true,                                  //强制转码为UTF-8
            callback: function (error,result,$) {            //error  爬取超时或返回错误HTTP代码
                if(error||!result.body){
                    errorCount++;
                    return resolve({result:false});
                }
                result = (result.body).replace(/[\r\n]/g, "");//正则表达式去除result中的回车和换行
                resolve({error,result,$});
            }
        })
    })
});

const getContent = co.wrap(function*(result){
let $ = cheerio.load(result);               //字符串转为DOM
let content = $("abc>def").text();          //获取<abc><def>中的内容

    return Promise.resolve({content})
});

for (let i = 1; i <= 250; i++) {            //生成10个url
    urlList.push(`http://dy-public.oss-cn-shenzhen.aliyuncs.com/interviewTestData/${i}.txt`)
}
router.get('/crawldata',function (req, res, next) {
    co(function*() {
        for (let url of urlList) {
            let {result} = yield crawlHtml(url);        //获取每个网页的body内容
            if (!result) {
                continue;
            }
            console.log(result);

            let {content} = yield getContent(result);   //获取body的内容
            console.log(`${content}`)
            id++;
            contentJson.push({                              //将结果存进contentJson
                id,
                url,
                content
            });
        }
    });
    res.render('index', { conten: contentJson});
})

//全局错误监听
process.on('unhandledRejection', function (err) {
    console.error(err.stack);
});
process.on(`uncaughtException`, console.error);

module.exports = router;