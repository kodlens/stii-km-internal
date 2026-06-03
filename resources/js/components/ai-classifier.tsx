
import { App, Button, Form, FormInstance, Popconfirm, Table } from 'antd';
import axios from 'axios';
import {  useEffect, useState } from 'react';
import { BrushCleaning, Trash2 } from 'lucide-react';
import ModalSelectCategory from './modal-select-category';
import { Category } from '@/types/category';


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

// type CategoryResult = {
//   category_id: number,
//   category: string,
//   score: number,
//   analysis: string
// }
const AiClassifier = ( { form, errors } : PageProps) => {

  //add load topics here

  const [loading, setLoading] = useState<boolean>(false);
  const { notification, message } = App.useApp();
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = () => {
    axios.get('/load-categories').then(res => {
      setCategories(res.data)
    }).catch(err => {
      console.log(err)
    })
  }

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

      console.log(res.data.results);

      const resData:AIResult[] = res.data.results

      const matchedTopics = resData.map(datum => {
        const matched = categories.find((cat:Category) => cat.id === datum.id);
        return {
          id: datum.id,
          category: matched?.category || "",
          score: datum.score,
          analysis: datum.analysis
        };
      });

      form.setFieldsValue({
        ...form.getFieldsValue(),
        categories: [...categories, matchedTopics]
      });
      // "message": "Undefined array key \"category_id\"",


      // setData(matchedTopics);
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


  const handleDelete = (categoryId:number) => {
    const categories = form.getFieldValue("categories") || [];

    form.setFieldsValue({
      categories: categories.filter(
        (item: { category_id: number }) => item.category_id !== categoryId
      ),
    });
  }

  useEffect(() => {
    loadCategories()
  }, [])

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
          const categories = form.getFieldValue("categories") || [];

          if(row.category_id > 0) {
            const exists = categories.some(
              ( item: { category_id: number }) => item.category_id === row.category_id
            );
            if (exists) {
                message.warning('Category already exists.');
              return;
            }
          }

          form.setFieldsValue({
            ...form.getFieldsValue(),
            categories: [...categories, row]
          });

          message.success('Category added successfully.');

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
            dataSource={form.getFieldValue("categories")}
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
                align: "center",
                width: 150,
                render: (_, record: { category_id: number }) => (
                  <Popconfirm
                    title="Remove Category"
                    description="Are you sure you want to remove this category?"
                    okText="Remove"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(record.category_id)}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<Trash2 size={18} />}
                    />
                  </Popconfirm>
                ),
              }
            ]}
          />
        </Form.Item>
       </div>


      <div className='flex gap-2'>
        <Button danger icon={<BrushCleaning size={15} />}
          onClick={()=>{
            form.setFieldValue('categories', [])
          }}
        >
          Remove All
        </Button>

      </div>

    </div>
  )
}

export default AiClassifier
