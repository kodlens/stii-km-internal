
import { App, Button, Form, FormInstance, Input, Table } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrushCleaning } from 'lucide-react';
import ModalSelectCategory from './modal-select-category';


type PageProps = {
  id:number;
  form: FormInstance
  errors: Record<string, unknown[]>
}
type AIResult = {
  id: number,
  score: number,
  analysis: string
}

type CategoryResult = {
  category_id: number,
  category: string,
  score: number,
  analysis: string
}
const AiClassifier = ( { form, errors, id } : PageProps) => {

  const [loading, setLoading] = useState<boolean>(false);
  const { notification, message } = App.useApp();
  const [data, setData] = useState<CategoryResult[]>([]);

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

      // const resData:AIResult[] = res.data.results

      // const matchedTopics = resData.map(datum => {
      //   const matched = topics.find((topic:Topic) => topic.id === datum.id);
      //   return {
      //     topic_id: datum.id,
      //     topic: matched?.topic || "",
      //     score: datum.score,
      //     analysis: datum.analysis
      //   };
      // });

      // setData(matchedTopics);
      // setLoading(false)

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

  // const loadTopics = async () => {
  //   //const res = await axios.get(`/get-subject-headings`);
  //   const res = await axios.get(`/load-categories`);
  //   setCategories(res.data);
  // };

  // useEffect(() => {
  //   loadTopics();
  // }, []);

  //load data if edit mode
  useEffect(() => {
    // if(id > 0){
    //   const subjH = form.getFieldValue('subject_headings');
    //   setData(subjH)
    // }
  }, [form, id])


  // useEffect(() => {

  //   form.setFieldValue("subject_headings", data.map(item => (
  //     {
  //       subject_heading_id: item.subject_heading_id,
  //       subject_heading: item.subject_heading,
  //       score: item.score,
  //       analysis: item.analysis
  //     }
  //   )));

  // }, [data]);


  const handleDelete = (categoryId:number) => {
    const index = data.findIndex(
      item => item.category_id === categoryId
    );

    if (index !== -1) {
      const newData = [...data];
      newData.splice(index, 1);
      setData(newData);
    }
  }

  return (
    <div className='border border-gray-300 p-4 rounded-md'>

      <div className='mb-4 my-2 p-4 bg-orange-100 rounded-md'>
        Use the AI assistant below to automatically detect and select the most relevant topic from your content.
        Make sure the content above is not empty, then click <span className='font-bold'>Generate Topics</span> to begin analysis.
      </div>

      <div className="flex gap-3">
        <Button
          type="primary"
          loading={loading}
          onClick={() => {
            handleClassification();
          }}>
          Generate Topics
        </Button>

        <ModalSelectCategory onSelectCategory={(row) => {
          if(row.category_id > 0) {
            const exists = data.some(
              item => item.category_id === row.category_id
            );
            if (exists) {
                message.warning('Category already exists.');
              return;
            }
          }

          setData([...data, row]);
        }} />
      </div>

      <div>
        <h3 className='my-2'>Generated Results:</h3>
        <Form.Item
          className="mt-4"
          validateStatus={errors.category ? "error" : ""}
          help={errors.category ? errors.category[0] as string : ""}>

          <Table
            rowKey="category_id"
            dataSource={data}
            pagination={false}
            size="small"
            columns={[
              {
                title: "Id",
                dataIndex: "category_id",
                key: "category_id",
                width: 120,
              },
              {
                title: "Cattegory",
                dataIndex: "category",
                key: "category",
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
                      onClick={() => handleDelete(record.category_id)}
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
        <Button danger icon={<BrushCleaning size={15} />}
          onClick={()=>{
            setData([])
          }}
        >
          Remove All
        </Button>

      </div>

    </div>
  )
}

export default AiClassifier
