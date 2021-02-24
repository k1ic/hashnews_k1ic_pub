import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import Layout from '../components/layout';
import { 
  LocaleProvider,
  Pagination,
  DatePicker,
  Upload,
  Icon,
  Modal,
  message,
  List,
  Avatar,
  Affix,
  Button
} from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import 'antd/dist/antd.css';

const listData = [];
for (let i = 0; i < 23; i++) {
  listData.push({
    href: 'http://ant.design',
    title: `ant design part ${i}`,
    avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
    description:
      'Ant Design, a design language for background applications, is refined by Ant UED Team.',
    content:
      'We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
  });
}

const IconText = ({ type, text }) => (
  <span>
    <Icon type={type} style={{ marginRight: 8 }} />
    {text}
  </span>
);

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

class App extends Component {

  constructor(props) {
    super(props);
    //console.log('newsflash props=', props);
    
    /*initial state*/
    this.state = {
      loading: false,
      previewImageVisible: false,
      previewImage: '',
      fileList: [],
    };
    
    this.winW = 0;
    this.winH = 0;
    this.sendAffixOffsetTop = 0;
  }

  beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      //message.error('You can only upload JPG/PNG file!');
      Modal.error({title: 'You can only upload JPG/PNG file!'});
      this.setState({ loading: false });
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      //message.error('Image must smaller than 2MB!');
      Modal.error({title: 'Image must smaller than 2MB!'});
      this.setState({ loading: false });
      return false;
    }
    return isJpgOrPng && isLt2M;
  }

  handleImagePreviewCancel = () => this.setState({ previewImageVisible: false });

  handleImagePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    
    console.log('handleImagePreview file.url=', file.url);
    console.log('handleImagePreview file.preview=', file.preview);
    
    this.setState({
      previewImage: file.url || file.preview,
      previewImageVisible: true,
    });
  };

  handleUploadChange = ({ fileList }) => this.setState({ fileList });
  
  onShowSizeChange(current, pageSize) {
    console.log(current, pageSize);
  }
  
  onPageChange(pageNumber) {
    console.log('Page: ', pageNumber);
  }
  render() {
    const { previewImageVisible, previewImage, fileList } = this.state;
    
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">上传</div>
      </div>
    );
    
    if(typeof(window) != "undefined"){
      this.winW = window.innerWidth;
      this.winH = window.innerHeight;
      console.log('render winW=', this.winW, 'winH=', this.winH);
      this.sendAffixOffsetTop = this.winH - 150;
    }
    
    return (
      <Layout title="Home">
        <Main>
          <LocaleProvider locale={zh_CN}>
            <div align="right" style={{ marginTop: `${this.sendAffixOffsetTop}`, marginRight: 0 }} >
              <Affix offsetTop={this.sendAffixOffsetTop}>
                <Button
                  type="link"
                  onClick={() => {
                  }}
                >
                  <Icon type="message" theme="filled" style={{ fontSize: '40px', color: "#2194FF" }}/>
                </Button>
              </Affix>
            </div>
            <div style={{ margin: 20 }}>
              <Pagination defaultCurrent={1} total={50} />
              <Pagination showSizeChanger onShowSizeChange={this.onShowSizeChange} onChange={this.onChange} defaultCurrent={1} total={500} />
              <Pagination showQuickJumper defaultCurrent={1} total={500} onChange={this.onPageChange} />
              <DatePicker />
            </div>
            <div className="clearfix">
              <Upload
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                listType="picture-card"
                showUploadList={false}
                fileList={fileList}
                beforeUpload={this.beforeUpload}
                onPreview={this.handleImagePreview}
                onChange={this.handleUploadChange}
              >
              {fileList.length >= 1 ? null : uploadButton}
              </Upload>
              <Modal visible={previewImageVisible} footer={null} onCancel={this.handleImagePreviewCancel}>
                <img alt="picture" style={{ width: '100%' }} src={previewImage} />
              </Modal>
            </div>
            <List
              itemLayout="vertical"
              size="large"
              pagination={{
                onChange: page => {
                  console.log(page);
                },
                pageSize: 3,
              }}
              dataSource={listData}
              footer={
                <div>
                  <b>ant design</b> footer part
                </div>
              }
              renderItem={item => (
                <List.Item
                  key={item.title}
                  actions={[
                    <IconText type="star-o" text="156" key="list-vertical-star-o" />,
                    <IconText type="like-o" text="156" key="list-vertical-like-o" />,
                    <IconText type="message" text="2" key="list-vertical-message" />,
                  ]}
                  extra={
                    <img
                      width={272}
                      alt="logo"
                      src="https://gw.alipayobjects.com/zos/rmsportal/mqaQswcyDLcXyDKnZfES.png"
                    />
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatar} />}
                    title={<a href={item.href}>{item.title}</a>}
                    description={item.description}
                  />
                  {item.content}
                </List.Item>
              )}
            />
          </LocaleProvider>
        </Main>
      </Layout>
    );
  }
}

const Main = styled.main`
  margin: 20px 0 0;

  .ant-upload-select-picture-card i {
    font-size: 32px;
    color: #999;
  }
  
  .ant-upload-select-picture-card .ant-upload-text {
    margin-top: 8px;
    color: #666;
  }
  
`;

export default App;