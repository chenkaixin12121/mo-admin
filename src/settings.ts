interface DefaultSettings {
  title: string;
  showSettings: boolean;
  tagsView: boolean;
  fixedHeader: boolean;
  sidebarLogo: boolean;
  darkMode: boolean;
  errorLog: string;
}

const defaultSettings: DefaultSettings = {
  title: 'mo-admin',
  showSettings: true,
  tagsView: true,
  fixedHeader: false,
  // 是否显示Logo
  sidebarLogo: true,
  // 是否启用暗色模式
  darkMode: false,
  errorLog: 'production',
};

export default defaultSettings;
