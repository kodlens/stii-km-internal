
import { App, Button, Form, FormInstance, Input, Table } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { BrushCleaning } from 'lucide-react';
import { Topic } from '@/types/topic';
import ModalTopics from './modal-topics';


type PageProps = {
  id:number;
  form: FormInstance
  errors: Record<string, string[]>
}
type AIResult = {
  id: number,
  score: number,
  analysis: string
}
type SubjectResult = {
  topic_id: number,
  topic?: string,
  score: number,
  analysis: string
}
const AiClassifier = ( { form, errors, id } : PageProps) => {

  const [loading, setLoading] = useState<boolean>(false);
  const { notification } = App.useApp();
  const [data, setData] = useState<SubjectResult[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);


  const handleClassification = () => {
    setLoading(true)
    const content = form.getFieldValue("content");

    if (content === undefined || content.trim() === "") {
      notification.error({
        message: "Empty Content",
        description: "Content is empty. Please provide content for classification.",
        duration: 5,
      });
      setLoading(false);
      return;
    }

    axios.post("/classify-content", { content: content }).then((res) => {

      if (res.data.results.length === 0) {
        notification.info({
          message: "No Relevant Topics",
          description: "The AI did not find any relevant topics for this article.",
          duration: 5,
        });
      }

      const resData:AIResult[] = res.data.results

      const matchedTopics = resData.map(datum => {
        const matched = topics.find((topic:Topic) => topic.id === datum.id);
        return {
          topic_id: datum.id,
          topic: matched?.topic || "",
          score: datum.score,
          analysis: datum.analysis
        };
      });

      setData(matchedTopics);
      setLoading(false)

    }).catch((error) => {
      //message.error(`Classification failed: ${err.message}`);
      if (axios.isAxiosError(error)) {
          // Network / server errors
          throw new Error(
              error.response?.data?.message ||
              error.message ||
              'Something went wrong'
          );

          throw error;
      }
      setLoading(false);
    });
  }

  const loadTopics = async () => {
    //const res = await axios.get(`/get-subject-headings`);
    const res = await axios.get(`/load-topics`);
    setTopics(res.data);
  };

  useEffect(() => {
    loadTopics();
  }, []);

  //load data if edit mode
  useEffect(() => {
    if(id > 0){
      const subjH = form.getFieldValue('subject_headings');
      setData(subjH)
    }
  }, [form, id])


  useEffect(() => {

    form.setFieldValue("subject_headings", data.map(item => (
      {
        subject_heading_id: item.subject_heading_id,
        subject_heading: item.subject_heading,
        score: item.score,
        analysis: item.analysis
      }
    )));

  }, [data]);

  const handleDelete = (subjH_id:number) => {
    const index = data.findIndex(
      item => item.subject_heading_id === subjH_id
    );

    if (index !== -1) {
      const newData = [...data];
      newData.splice(index, 1);
      setData(newData);
    }
  }

  return (
    <div className='border p-4 rounded-md'>

      <div className='mb-4 my-2 p-4 bg-orange-100 rounded-md'>
        Use the AI assistant below to automatically detect and select the most relevant topic from your content.
        Make sure the content above is not empty, then click <span className='font-bold'>Generate Topics</span> to begin analysis.
      </div>

      <Button
        type="primary"
        loading={loading}
        onClick={() => {
          handleClassification();
        }}>
        Generate Topics
      </Button>

      <div>
        <h3 className='my-2'>Generated Results:</h3>
        <Form.Item
          className="mt-4"
          validateStatus={errors.subject_headings ? "error" : ""}
          help={errors.subject_headings ? errors.subject_headings[0] : ""}>

          <Table
            rowKey="subject_heading_id"
            dataSource={data}
            pagination={false}
            size="small"
            columns={[
              {
                title: "Id",
                dataIndex: "Id",
                key: "topic_id",
                width: 120,
              },
              {
                title: "Topics",
                dataIndex: "subject_heading",
                key: "subject_heading",
                width: 200,
              },
              {
                title: "Score",
                dataIndex: "score",
                key: "score",
                width: 120,
              },
              {
                title: "Analysis",
                dataIndex: "analysis",
                key: "analysis",
              },
              {
                title: "Action",
                key: "action",
                width: 150,
                render: (_, record) => (
                  <>
                    <Button
                      type="link"
                      danger
                      onClick={() => handleDelete(record.topic_id)}
                    >
                      Delete
                    </Button>
                  </>
                ),
              },
            ]}
          />
        </Form.Item>
       </div>


      <div className='flex gap-2'>
        <ModalTopics onSelectTopic={(record:Topic) => {

          const existsInData = data.find(item => item.topic_id === record.id);

          if(existsInData) {
            notification.warning({
              message: "Already Exists",
              description: "This topic is already in the classification results.",
              duration: 5,
              placement: 'bottomRight'
            });
            return;
          }

          setData([...data, {
              topic_id: record.id,
              topic: record.topic,
              score: 1,
              analysis: "Manually added"
            }]);
        }} />

        <Button danger icon={<BrushCleaning size={15} />}
          onClick={()=>{
            setData([])
          }}
        >
          Remove All
        </Button>

        <Form.Item name="subject_headings" hidden>
          <Input />
        </Form.Item>


      </div>

    </div>
  )
}

export default AiClassifier
