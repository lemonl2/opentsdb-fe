<template>
 <div class="main">
   <!-- <header class="header">线程池使用情况</header> -->
   <el-divider content-position="center"> 线程池使用情况</el-divider>
   <el-row :gutter="12">
    <el-col :span="8">
      <el-card shadow="always">
        <p>总任务: {{data.length}}</p>
        <p>Running: {{data.filter(x=> x.jobStatus==='Running').length}}, Stop: {{data.filter(x=> x.jobStatus==='Stop').length}}</p>
        <p></p>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card shadow="always" title="核心线程总数为2*CPU核心数">
        <p>核心线程总数: {{threadConfig.corePoolSize}}</p>
        <p>已使用: {{data.filter(x=> x.jobStatus==='Running').length}}, 未使用: {{threadConfig.corePoolSize - data.filter(x=> x.jobStatus==='Running').length}}</p>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card shadow="always" title="最大线程数和队列长度可以在配置文件进行修改">
        <p>最大线程数: {{threadConfig.maximumPoolSize}}</p>
        <p>最大队列长度: {{threadConfig.workQueue}}</p>
      </el-card>
    </el-col>
  </el-row>
  <el-divider content-position="center">采集任务列表</el-divider>
  <el-row>
    <el-button type="primary" size="small" icon="el-icon-edit" @click="openDrawer()" class="add-btn">添加</el-button>
    <el-table :data="table" :default-sort = "{prop: 'jobName', order: 'ascending'}" style="width: 100%" :row-class-name="tableRowClassName">
      <el-table-column fixed prop="jobId" label="任务Id" width="280"></el-table-column>
      <el-table-column fixed prop="jobName" label="任务名称" width="140" sortable></el-table-column>
      <el-table-column prop="source.apiUrl" label="api地址" width="200" sortable></el-table-column>
      <!-- <el-table-column prop="source.body.initStart" label="初始时间" width="160" sortable :formatter="dateFormat"></el-table-column>
      <el-table-column prop="source.body.startTemp" label="开始时间" width="160" sortable :formatter="dateFormat"></el-table-column>
      <el-table-column prop="source.body.endTemp" label="结束时间" width="160" sortable :formatter="dateFormat"></el-table-column> -->
      <el-table-column prop="sink.bootstrapServers" label="kafka地址" sortable width="180"></el-table-column>
      <el-table-column prop="sink.topic" label="kafka主题" width="160" sortable></el-table-column>
      <el-table-column prop="statistics.inputCount" label="采集量" width="100" sortable></el-table-column>
      <el-table-column prop="statistics.outputCount" label="输出量" width="100" sortable></el-table-column>
      <el-table-column prop="jobStatus" label="任务状态" width="100" fixed="right" sortable></el-table-column>
      <el-table-column fixed="right" label="操作" width="170">
        <template slot-scope="scope">
          <el-button @click="viewJob(scope.row)" type="text" size="small">查看</el-button>
          <el-button v-if="scope.row.jobStatus==='Stop'" @click="modifyJob(scope.row)" type="text" size="small">编辑</el-button>
          <el-button v-if="scope.row.jobStatus==='Stop'" @click="startJob(scope.row)" type="text" size="small">启动</el-button>
          <el-button v-if="scope.row.jobStatus==='Running'" @click="stopJob(scope.row)" type="text" size="small">停止</el-button>
          <el-button v-if="scope.row.jobStatus==='Stop'" @click="deleteJob(scope.row)" type="text" size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[5, 10, 15, 20, 25, 30, 35]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total">
    </el-pagination>
    <el-drawer title="任务相关配置" :visible.sync="drawer" size="35%" :with-header="false" :wrapperClosable="false" class="metric">
      <el-form :model="jobForm" :rules="rules" size="small" ref="jobForm" label-width="100px" class="jobForm">
        <p>注意：
          1. 开始时间：表示采集开始时间，随着任务的执行，开始时间会一直往后移动；结束时间：后端会根据时间长短算法往后推到一个合理的时间点；
          2. 开始时间创建之后不允许再次修改；
          3. 采集器每次采集后，最后数据的timestamp值设置为下一次的开始时间；
        </p>
        <p>1.基本配置</p>
        <el-form-item label="任务名称" prop="jobName">
          <el-input v-model="jobForm.jobName" :readonly="isView"></el-input>
        </el-form-item>
        <el-form-item label="API地址" prop="source.apiUrl">
          <el-input v-model="jobForm.source.apiUrl" :readonly="isView"></el-input>
        </el-form-item>
        <!-- <el-form-item label="初始时间" prop="source.body.initStart">
          <el-date-picker :readonly="isView" type="datetime" placeholder="选择日期" v-model="jobForm.source.body.initStart" style="width: 100%"></el-date-picker>
        </el-form-item> -->
        <!-- <el-form-item v-show="jobForm.jobId" label="开始时间" prop="source.body.start">
          <el-date-picker :readonly="isView" type="datetime" placeholder="选择日期" v-model="jobForm.source.body.start" style="width: 100%"></el-date-picker>
        </el-form-item> -->
        <p>2.指标项<i class="el-icon-circle-plus-outline" @click="addMetric()" title="增加此指标项" v-show="!isView"></i></p>
        <el-form-item v-for="(query, index) in jobForm.source.body.queries" :key="query.metric"
          :prop="'source.body.queries.' +index+ '.metric'"
          :rules="[{ required: true, message: '请选择数据', trigger: ['blur','change'] }]">
          <el-divider content-position="left">指标<i class="el-icon-remove-outline" @click="deleteMetric(query)" title="删除此指标项" v-show="!isView"></i></el-divider>
          <p class="head">开始采集时间</p>
          <el-date-picker :readonly="isView" :disabled="jobForm.jobId" type="datetime" placeholder="选择日期" value-format="timestamp" v-model="query.start" style="width: 100%"></el-date-picker>
          <p class="head">指标名称</p>
          <el-select :disabled="isView" v-model="query.metric" filterable remote reserve-keyword placeholder="请输入关键词" :remote-method="getMetrics" style="width: 95%">
            <el-option v-for="item in metricOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <p class="head">标签<i class="el-icon-circle-plus-outline" @click="addTag(query)" title="增加此指标的标签" v-show="!isView"></i></p>
          <div v-for="tag in query.tagsTemp" :key="tag.label">
            <el-select :disabled="isView" v-model="tag.label" filterable remote reserve-keyword placeholder="请输入关键词" :remote-method="getTagKs">
              <el-option v-for="item in tagKOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
            <el-select :disabled="isView" v-model="tag.value" filterable remote reserve-keyword placeholder="请输入关键词" :remote-method="getTagVs" style="width: 45%">
              <el-option v-for="item in tagVOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select><i class="el-icon-remove-outline" @click="deleteTag(query, tag)" title="删除此指标的标签" v-show="!isView"></i>
          </div>
          <p class="head">聚合类型</p>
          <el-select :disabled="isView" v-model="query.aggregator" filterable reserve-keyword placeholder="请输入关键词" style="width: 100%">
            <el-option v-for="item in aggregatorOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <p>3.kafka存储</p>
        <el-form-item label="kafka地址" prop="sink.bootstrapServers">
          <el-input :readonly="isView" v-model="jobForm.sink.bootstrapServers"></el-input>
        </el-form-item>
        <el-form-item label="kafka主题" prop="sink.topic">
          <el-input :readonly="isView" v-model="jobForm.sink.topic"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button v-show="!isView" type="primary" @click="createJob('jobForm')">确定</el-button>
          <el-button @click="drawer=false">关闭</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </el-row>
 </div>
</template>

<script>
// @ is an alias to /src
import {OpentsdbApi} from '@/apis';
import moment from 'moment';

const defaultJob = {
  "jobName": "任务名称",
	"source": {
		"apiUrl": "http://192.168.21.131:4242",
		"body": {
        "start": null,
		    "showTSUIDs":"true",
		    "msResolution": "true",
		    "queries": [
		        {
                "start": +new Date(),
                "aggregator": "none",
                "metric": "tcollector.collector.lines_received",
                "tagsTemp": [],
		            "tags": {
		             }
		        }
		    ]
		}
	},
	"sink": {
		"bootstrapServers": "192.168.21.120:9092",
		"topic": "opentsdb"
	}
};
export default {
  name: 'Home',
  components: {
  },
  data() {
    return {
      drawer: false,
      table: [],
      data: [],
      keyword: '',
      jobForm: defaultJob,
      metricOptions: [],
      metric: '',
      tagKOptions: [],
      tagVOptions: [],
      tags: [],
      aggregatorOptions: [],
      currentPage: 1,// 当前页数
      pageSize: 10,// 每页条数
      total: 0, // 总条目数
      isView: false,
      threadConfig: {},
      rules: {
        jobName: [
          { required: true, message: '请输入任务名称', trigger: 'blur' },
        ],
        'source.apiUrl': [
          { required: true, message: '请输入opentsdb地址', trigger: 'blur' },
        ],
        // 'source.body.initStart': [
        //   { type: 'date', required: true, message: '请输入采集初始时间', trigger: 'change' },
        // ],
        // 'source.body.start': [
        //   { type: 'date', required: true, message: '请输入采集开始时间', trigger: 'change' },
        // ],
        'source.body.queries[0].metric': [
          { required: true, message: '请选择指标项', trigger: 'blur' },
        ],
        'source.body.queries[0].aggregator': [
          { required: true, message: '请选择聚合类型', trigger: 'blur' },
        ],
        'sink.bootstrapServers': [
          { required: true, message: '请选择kafka地址', trigger: 'blur' },
        ],
        'sink.topic': [
          { required: true, message: '请选择kafka主题', trigger: 'blur' },
        ]
      }
    };
  },
  methods: {
    addMetric() {
      this.jobForm.source.body.queries.push({aggregator: 'none', metric: '', tags: {}, tagsTemp: []});
    },
    deleteMetric(query) {
      const index = this.jobForm.source.body.queries.findIndex(x => x.metric === query.metric);
      this.jobForm.source.body.queries.splice(index, 1);
    },
    modifyJob(row) {
      this.isView = false;
      this.drawer = true;
      this.jobForm = row;
      row.source.body.queries.forEach(x=> {
        const arr = Object.entries(x.tags);
        x.tagsTemp = arr.map(([label, value]) => ({label, value}));
      });
    },
    async getThreadConfig() {
      const {data} = await OpentsdbApi.getThreadConfig();
      this.threadConfig = data.entity;
    },
    dateFormat(row, column, cellValue) {
      return cellValue ? moment(cellValue).format('YYYY/MM/DD HH:mm:ss'): moment().format('YYYY/MM/DD HH:mm:ss');
    },
    async deleteJob(row) {
      this.$confirm('此操作将永久删除该任务, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(()=> OpentsdbApi.deleteJob(row)).then(({data})=> {
          if (data.code === '0000') {
            this.$message({message: data.entity, type: 'success'});
            this.getJobs();
          } else {
            this.$message.error('删除任务失败！');
          }
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          });
        });
    },
    async stopJob(row) {
      const {data} = await OpentsdbApi.stopJob(row);
      if (data.code === '0000') {
        this.$message({message: data.entity, type: 'success'});
        row.jobStatus = 'Stop';
      } else {
        this.$message.error('停止任务失败！');
      }
    },
    async startJob(row) {
      const {data} = await OpentsdbApi.startJob(row);
      if (data.code === '0000') {
        this.$message({message: data.entity, type: 'success'});
        row.jobStatus = 'Running';
      } else {
        this.$message.error('启动任务失败！');
      }
    },
    handleSizeChange(val) {
     console.log(`每页 ${val} 条`);
     this.pageSize = val;
     this.table = this.data.slice((this.currentPage-1)*this.pageSize,this.currentPage*this.pageSize)
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`);
      this.currentPage = val;
      this.table = this.data.slice((this.currentPage -1)*this.pageSize,this.currentPage *this.pageSize)
    },
    createJob(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          // 表示编辑状态
          // if (this.jobForm.jobId) {
          //   this.jobForm.source.body.start = +new Date(this.jobForm.source.body.start);
          // } else {
          //   this.jobForm.source.body.start = +new Date(this.jobForm.source.body.initStart);
          // }
          // this.jobForm.source.body.startTemp = +new Date(this.jobForm.source.body.start);
          // this.jobForm.source.body.initStart = +new Date(this.jobForm.source.body.initStart);
          this.jobForm.source.body.queries.forEach(x=> {
            x.tags = {};
            x.tagsTemp.forEach(tag=> x.tags[tag.label] = tag.value)
          });
          OpentsdbApi.createJob(this.jobForm).then(({data}) => {
            if (data.code === '0000') {
              this.$message({message: data.entity, type: 'success'});
              this.drawer = false;
            } else {
              this.$message.error('创建任务失败！');
            }
          })
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    deleteTag(query, tag) {
      const index = query.tagsTemp.findIndex(x => x.label === tag.label);
      query.tagsTemp.splice(index, 1);
    },
    addTag(query) {
      query.tagsTemp.push({label: '', value: ''});
    },
    tableRowClassName({row, rowIndex}) {
      if (row.jobStatus === "Stop") {
        return 'warning-row';
      } else {
        return 'success-row';
      }
    },
    openDrawer() {
      this.drawer = true;
      this.jobForm = defaultJob;
      this.isView = false;
      this.jobForm.source.body.queries.forEach(x=> {
        const arr = Object.entries(x.tags);
        x.tagsTemp = arr.map(([label, value]) => ({label, value}));
      })
    },
    async getJobs() {
      const {data} = await OpentsdbApi.getJobs();
      this.data = data.entity;
      this.total = this.data.length;
      this.table = this.data.slice((this.currentPage-1)*this.pageSize,this.currentPage*this.pageSize)
    },
    viewJob(row) {
      this.drawer = true;
      this.isView = true;
      this.jobForm = row;
      row.source.body.queries.forEach(x=> {
        const arr = Object.entries(x.tags);
        x.tagsTemp = arr.map(([label, value]) => ({label, value}));
      });
    },
    async getMetrics(query) {
      if (query !== '') {
        const {data} = await OpentsdbApi.getSuggest({apiUrl: this.jobForm.source.apiUrl, type: 'metrics', q: query});
          this.metricOptions = data.entity.filter(item => {
            return item.toLowerCase()
              .indexOf(query.toLowerCase()) > -1;
          });
      } else {
        this.metricOptions = [];
      }
    },
    async getTagKs(query) {
      if (query !== '') {
        const {data} = await OpentsdbApi.getSuggest({apiUrl: this.jobForm.source.apiUrl, type: 'tagk', q: query});
          this.tagKOptions = data.entity.filter(item => {
            return item.toLowerCase()
              .indexOf(query.toLowerCase()) > -1;
          });
      } else {
        this.tagKOptions = [];
      }
    },
    async getTagVs(query) {
      if (query !== '') {
        const {data} = await OpentsdbApi.getSuggest({apiUrl: this.jobForm.source.apiUrl, type: 'tagv', q: query});
          this.tagVOptions = data.entity.filter(item => {
            return item.toLowerCase()
              .indexOf(query.toLowerCase()) > -1;
          });
      } else {
        this.tagVOptions = [];
      }
    },
    async getAggregators() {
      const {data} = await OpentsdbApi.getAggregators({apiUrl: this.jobForm.source.apiUrl});
      this.aggregatorOptions = data.entity;
    }
  },
  mounted() {
    this.getAggregators();
    this.getJobs();
    this.getThreadConfig();
    const interval = setInterval(()=> {
       this.getJobs();
    }, 3000);
    this.$once('hook:beforeDestroy', () => {
      clearInterval(interval);
    })
  },
}
</script>

<style lang="scss" scoped>
// .header {
//   text-align: left;
// }
.head {
  margin: 0;
}
.el-divider__text {
  font-size: 17px;
}
.add-btn {
  float: right;
  margin-bottom: 5px;
}
.el-table {
  .warning-row {
    background: oldlace;
  }
  .success-row {
    background: #d9f3cb;
  }
}
.jobForm {
  padding: 10px;
}
.el-icon-remove-outline {
  font-size: 16px;
  &:hover {
    color: #1989fa;
  }
}
.el-icon-circle-plus-outline {
   font-size: 16px;
  &:hover {
    color: #1989fa;
  }
}
</style>
