declare module 'element-plus' {
  import type { App } from 'vue'
  
  export const ElButton: any
  export const ElInput: any
  export const ElForm: any
  export const ElFormItem: any
  export const ElTable: any
  export const ElTableColumn: any
  export const ElDialog: any
  export const ElMessage: any
  export const ElMessageBox: any
  export const ElMenu: any
  export const ElMenuItem: any
  export const ElSubMenu: any
  export const ElBreadcrumb: any
  export const ElBreadcrumbItem: any
  export const ElCard: any
  export const ElRow: any
  export const ElCol: any
  export const ElDatePicker: any
  export const ElSelect: any
  export const ElOption: any
  export const ElTag: any
  export const ElPagination: any
  export const ElSwitch: any
  export const ElTimePicker: any
  export const ElTabs: any
  export const ElTabPane: any
  export const ElDescriptions: any
  export const ElDescriptionsItem: any
  export const ElEmpty: any
  export const ElLoading: any
  export const ElIcon: any
  
  export function install(app: App): void
  export default function install(app: App): void
}

declare module '@element-plus/icons-vue' {
  import type { Component } from 'vue'
  
  export const HomeFilled: Component
  export const User: Component
  export const Shop: Component
  export const Calendar: Component
  export const Money: Component
  export const Setting: Component
  export const ArrowDown: Component
  export const ArrowUp: Component
  export const Plus: Component
  export const Edit: Component
  export const Delete: Component
  export const Search: Component
  export const Refresh: Component
  export const Check: Component
  export const Close: Component
  export const InfoFilled: Component
  export const WarningFilled: Component
  export const CircleCheck: Component
  export const CircleClose: Component
}
