<template>
  <div id="app">
    <el-header>
      <h1>
        这是一个没什么用的工具
        <i class="el-icon-files"></i>
      </h1>
    </el-header>
    <el-main>
      <h2>一、压缩文件</h2>
      <el-steps direction="vertical">
        <el-step
          title="步骤 1"
          description="上传文件之前先选择想要打包的类型"
        ></el-step>
        <el-step
          title="步骤 2"
          description="选择完之后点击上传文件或上传文件夹"
        ></el-step>
        <el-step
          title="步骤 3"
          description="点击下载按钮，调用/downloadpackage接口，下载打包后的压缩包"
        ></el-step>
      </el-steps>
      <el-divider></el-divider>
      <el-select
        v-model="type"
        placeholder="请选择需要的压缩包类型"
        style="margin-right:10px;"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
      <el-button type="primary" @click="getFiles" icon="el-icon-files">
        选择打包文件
      </el-button>
      <el-button type="primary" @click="getFolder" icon="el-icon-folder">
        选择打包文件夹
      </el-button>
      <input
        type="file"
        ref="folderInput"
        @change="uploadFile"
        multiple
        webkitdirectory
        style="display:none;"
      />
      <input
        type="file"
        ref="fileInput"
        @change="uploadFile"
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
        下载压缩包
      </el-button>
      <el-divider></el-divider>
      <h2>二、解压文件</h2>
      <el-steps direction="vertical">
        <el-step
          title="步骤 1"
          description="点击上传文件或上传压缩包"
        ></el-step>
        <el-step
          title="步骤 2"
          description="点击下载按钮，调用/downloaddecompression接口，下载打包后的压缩包"
        ></el-step>
      </el-steps>
      <el-divider></el-divider>
      <div>打包完了，那就顺手解压掉吧</div>
      <input
        type="file"
        ref="zipInput"
        @change="cutFile"
        accept=".zip,.tgz,.tar"
        style="display:none;"
      />
      <el-button
        type="primary"
        @click="getZip"
        icon="el-icon-folder"
        style="margin-top:24px;"
      >
        选择打包文件夹
      </el-button>
      <el-divider></el-divider>
      <div>如果文件选择完了，那就下载吧</div>
      <el-button
        type="primary"
        @click="downloadcompression"
        icon="el-icon-download"
        style="margin-top:24px;"
      >
        下载解压包
      </el-button>
      <!-- <el-button type="primary" @click="getCode">发送验证码</el-button> -->
    </el-main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      options: [
        {
          value: 'oldzip',
          label: 'jszip打包zip'
        },
        {
          value: 'zip',
          label: 'zip'
        },
        {
          value: 'tgz',
          label: 'tgz'
        },
        // {
        //   value: 'gzip',
        //   label: 'gzip'
        // },
        {
          value: 'tar',
          label: 'tar'
        }
      ],
      type: '',
      filename: '',
      compressionname: '',
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
    getCode() {
      this.api.postCode();
    },
    getFiles() {
      if (this.type) {
        this.$refs.fileInput.click();
      } else {
        this.$message.error('请先选择需要打包的压缩包类型');
      }
    },
    getFolder() {
      if (this.type) {
        this.$refs.folderInput.click();
      } else {
        this.$message.error('请先选择需要打包的压缩包类型');
      }
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
    /*生成以下数据格式
      [
        {
          label:'',
          children: [
            {
              label: ''
            }
          ]
        }
      ]
    */

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
    },
    // 上传文件文件夹以及打包后返回打包后的文件夹名称
    uploadFile(e) {
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
      this.api
        .postRelativePath({ type: this.type, ...this.relativePath })
        .then(() => {
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

          if (this.type == 'oldzip') {
            this.api.postPackage(files).then(res => {
              this.filename = `${res.result.filename}.${res.result.type}`;
              // 去重完成之后生成文件夹数组
              this.filedata = [
                {
                  label: `${res.result.filename}.${res.result.type}`,
                  children: [
                    {
                      label: res.result.filename,
                      children: this.creatFileArray(this.fileObj)
                    }
                  ]
                }
              ];
              // 打包完之后记得清除输入框的文件
              this.$refs.fileInput.value = '';
              this.$refs.folderInput.value = '';
              loading.close();
            });
          } else {
            this.api.postNewpackage(files).then(res => {
              this.filename = `${res.result.filename}.${res.result.type}`;
              // 去重完成之后生成文件夹数组
              this.filedata = [
                {
                  label: `${res.result.filename}.${res.result.type}`,
                  children: [
                    {
                      label: res.result.filename,
                      children: this.creatFileArray(this.fileObj)
                    }
                  ]
                }
              ];
              // 打包完之后记得清除输入框的文件
              this.$refs.fileInput.value = '';
              this.$refs.folderInput.value = '';
              loading.close();
            });
          }
        });
    },
    download() {
      if (this.filename) {
        window.location.href = `http://xxx:3000/api/downloadpackage?filename=${this.filename}`;
      } else {
        this.$message.error('接口未返回任何有效地址');
      }
    },
    getZip() {
      this.$refs.zipInput.click();
    },
    cutFile(e) {
      let files = new FormData();
      files.append(`file`, e.target.files[0]);
      // console.log(e.target.files);
      this.api.postDecompression(files).then(res => {
        this.compressionname = res.result.filename;
        this.$refs.zipInput.value = '';
      });
    },
    downloadcompression() {
      if (this.filename) {
        window.location.href = `http://xxx:3000/api/downloaddecompression?filename=${this.compressionname}`;
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
