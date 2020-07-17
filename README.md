# package-file-h5

### 一、开发背景

这个工具是我在很无聊很无聊的时候写的，一开始只是想实现一下上传本地文件或者文件夹，然后在前端生成目录树。后来想想，要不就再弄个打包的吧，于是就有了这个没用的工具……其实这个工具有个缺点，就是，还打包不了gzip和rar，这个我有空再搞搞吧！

### 二、接口

baseUrl：http://localhost:3000/api

- POST */relativePath*
- POST */package*
- POST */newpackage*
- POST */decompression* 
- GET */downloadpackage*
- GET */downloaddecompression*

具体接口文档请看https://github.com/Nangxif/package-file-server

### 三、部分实现思路

一开始，我能获取到的数据是这样的

```
{
    file0: "src/App.vue"
    file1: "src/main.js"
    file2: "src/assets/logo.png"
    file3: "src/api/index.js"
}
```

但是，ElementUI的树形组件el-tree需要的数据格式是这样的

```
[{
    label: '一级 1',
    children: [{
      label: '二级 1-1',
      children: [{
        label: '三级 1-1-1'
      }]
    }]
  }, {
    label: '一级 2',
    children: [{
      label: '二级 2-1',
      children: [{
        label: '三级 2-1-1'
      }]
    }]
  }
 }]
```

所以第一步，先把上面能拿到的数据通过下面这个方法转换成这种形式

```javascript
/*
文件夹用对象表示，文件用空字符表示
[
  { src: { "App.vue": "" } },
  { src: { "main.js": "" } },
  { src: { assets: { "logo.png": "" } } },
  { src: { api: { "index.js": "" } } },
];*/
Object.values(this.relativePath).forEach(item => {
  // 这里拿到的是a/b/c.vue这样的结构
  let target = {};
  item.split('/').reduce((total, val, index) => {
    if (index < item.split('/').length - 1) {
      total[val] = {};
      return total[val];
    } else {
      total[val] = '';
      return target;
    }
  }, target);
  // 这样生成的数据结构是[{a:{b:{c.vue:""}}}]
  this.fileArray.push(target);
});
```

但是这样的话，其实有好多个元素对象里面都有同样的src键，这个时候我们要进行合并

```
this.fileArray.forEach((item, index) => {
  let abstObj = { ...this.fileObj };
  this.fileObj = this.deWeight(
    item,
    Object.values(this.relativePath)[index].split('/'),
    undefined,
    abstObj
  );
});


deWeight(obj, format, level = 0, targetObj) {
  let levelObj = obj[format[level]];
  if (level < format.length - 1) {
    if (targetObj[format[level]]) {
      return {
        ...targetObj,
        [format[level]]: this.deWeight(
          levelObj,
          format,
          level + 1,
          targetObj[format[level]]
        )
      };
    } else {
      // 如果没有重复了，直接返回全部对象
      return {
        ...targetObj,
        [format[level]]: levelObj
      };
    }
  } else {
    return {
      ...targetObj,
      [format[level]]: levelObj
    };
  }
}
```

然后拿到的数据是这样的

```
{
  src: {
    "App.vue": "",
    "main.js": "",
    assets: { "logo.png": "" },
    api: { "index.js": "" },
  }
}
```

最后一步

```
// 去重完成之后生成文件夹数组
this.filedata = [
  {
    label: `download${time.timestamp}.zip`,
    children: this.creatFileArray(this.fileObj)
  }
];


creatFileArray(target) {
  let targetArr = [];
  Object.keys(target).forEach((item, index) => {
    if (typeof Object.values(target)[index] == 'object') {
      targetArr.push({
        label: item,
        children: this.creatFileArray(Object.values(target)[index])
      });
    } else {
      targetArr.push({
        label: item
      });
    }
  });
  return targetArr;
}
```

emmm，代码没有怎么解释，里面好多递归，作者很懒，就写到这……