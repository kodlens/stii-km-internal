import axios, { isAxiosError } from 'axios';
import { notification } from 'antd';

export const draft = (id:number, onRefresh: () => void) => {
  axios.post('/encoder/materials/set-draft-materials/' + id, {
    id: id
  }).then((res) => {
    if (res.data.success) {
      notification.success({
        message: 'Material Updated',
        description: 'Material has set to draft successfully.',
      });
    }
    onRefresh();
  })
  .catch(err => {
    if(isAxiosError(err) && err.response){
      notification.error({
        message: 'Error!',
        description: err.response.data.message,
      });
    }
  });
}

export const submit = (id:number, onRefresh: () => void) => {
  axios.post('/encoder/materials/set-submit-materials/' + id, {
    id: id
  }).then((res)=> {
    if (res.data.success) {
      notification.success({
        message: 'Material Updated',
        description: 'Material has been updated successfully.',
      });
    }
    onRefresh();
  })
  .catch(err => {
    if(isAxiosError(err) && err.response){
      notification.error({
        message: 'Error!',
        description: err.response.data.message,
      });
    }
  });
}


export const publish = (id:number, onRefresh: () => void) => {
  axios.post('/publisher/materials/set-publish-materials/' + id, {
    id: id
  }).then((res)=> {
    if (res.data.success) {
      notification.success({
        message: 'Material Updated',
        description: 'Material has been set to publish successfully.',
      });
    }
    onRefresh();
  })
  .catch(err => {
    if(isAxiosError(err) && err.response){
      notification.error({
        message: 'Error!',
        description: err.response.data.message,
      });
    }
  });
}


