declare const XLSX: {
  utils: {
    json_to_sheet: (data: any[], opts?: any) => any;
    book_new: () => any;
    book_append_sheet: (wb: any, ws: any, name: string) => void;
    sheet_to_json: (ws: any, opts?: any) => any[];
  };
  read: (data: any, opts?: any) => any;
  writeFile: (wb: any, filename: string) => void;
};
