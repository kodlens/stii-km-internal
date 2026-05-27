import { Category } from '@/types/category';
import { Select } from 'antd';
import axios from 'axios'
import { useEffect, useState } from 'react'
type Props = {
  onChange?: (value: string) => void;
}

const SelectCategory = ( { onChange }: Props) => {

  const [categories, setCategories] = useState<Category[]>([])


  useEffect(() => {
    loadCategories()
  }, [])


  const loadCategories = async () => {
    axios.get(`/load-categories`).then(res => {
      setCategories(res.data)
    }).catch(err => {
      console.log(err)

    })
  }

  return (
    <Select
      placeholder="Filter by category"
      className="w-full"
      allowClear
      popupMatchSelectWidth={false}
      popupClassName="wide-select-dropdown"
      onChange={(value:string) => onChange!(value)}
      options={categories.map(category => ({ label: category.category, value: category.id }))}
    />
  )
}

export default SelectCategory
