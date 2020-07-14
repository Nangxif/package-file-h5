<template>
  <div id="app">
    <el-header>
      <h1>
        这是一个没什么用的工具
        <i class="el-icon-files"></i>
      </h1>
    </el-header>
    <el-main>
      <el-steps direction="vertical">
        <el-step
          title="步骤 1"
          description="调用/relativePath接口，将即将上传的文件的格式目录传递给接口"
        ></el-step>
        <el-step
          title="步骤 2"
          description="调用/package接口，后台生成压缩文件之后返回压缩文件名称"
        ></el-step>
        <el-step
          title="步骤 3"
          description="调用/download接口，下载打包后的压缩包"
        ></el-step>
      </el-steps>
      <el-divider></el-divider>

      <el-button type="primary" @click="getFiles" icon="el-icon-files">
        选择上传文件
      </el-button>
      <el-button type="primary" @click="getFolder" icon="el-icon-folder">
        选择上传文件夹
      </el-button>
      <input
        type="file"
        ref="folderInput"
        @change="getFile"
        multiple
        webkitdirectory
        style="display:none;"
      />
      <input
        type="file"
        ref="fileInput"
        @change="getFile"
        multiple
        style="display:none;"
      />
      <el-divider></el-divider>
      <div>当前下载按钮下载的打包文件：</div>
      <el-tree :data="filedata" :props="defaultProps"></el-tree>
      <el-divider></el-divider>
      <div>如果文件选择完了，那就下载吧</div>
      <el-button
        type="primary"
        @click="download"
        icon="el-icon-download"
        style="margin-top:24px;"
      >
        下载
      </el-button>
    </el-main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      filename: '',
      filedata: [],
      fileArray: [],
      relativePath: {},
      fileObj: {},
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      isFolder: false,
      filenameArray: []
    };
  },
  methods: {
    getFiles() {
      this.$refs.fileInput.click();
    },
    getFolder() {
      this.$refs.folderInput.click();
    },
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
    },
    creatFileArray(target) {
      // let entriesArr = Object.entries(target);
      let targetArr = [];
      // if()
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
    },
    getFile(e) {
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      this.filedata = [];
      this.fileObj = {};
      this.fileArray = [];
      this.relativePath = {};
      let files = new FormData();
      e.target.files.forEach((item, index) => {
        files.append(`file${index}`, item);
        if (item.webkitRelativePath) {
          this.relativePath[`file${index}`] = item.webkitRelativePath;
        } else {
          this.relativePath[`file${index}`] = `download/${item.name}`;
        }
      });
      this.api.postRelativePath(this.relativePath).then(time => {
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
        // 接下来去重
        this.fileArray.forEach((item, index) => {
          let abstObj = { ...this.fileObj };
          this.fileObj = this.deWeight(
            item,
            Object.values(this.relativePath)[index].split('/'),
            undefined,
            abstObj
          );
        });
        // 去重完成之后生成文件夹数组
        this.filedata = [
          {
            label: `download${time.timestamp}.zip`,
            children: this.creatFileArray(this.fileObj)
          }
        ];

        this.api.postPackage(files).then(res => {
          this.filename = res.filename;
          loading.close();
        });
      });
    },
    download() {
      if (this.filename) {
        window.location.href = `http://192.168.1.125:3000/api/download?filename=${this.filename}`;
      } else {
        this.$message.error('接口未返回任何有效地址');
      }
    }
  }
};
</script>

<style lang="scss">
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
