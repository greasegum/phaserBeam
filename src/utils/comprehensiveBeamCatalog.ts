export interface BeamDimensions {
  id: string
  designation: string
  depth: number // Total depth in inches
  webThickness: number // Web thickness in inches
  flangeWidth: number // Flange width in inches
  flangeThickness: number // Flange thickness in inches
  weight: number // Weight per foot in lbs
  filletRadius: number // Interior fillet radius R in inches
}

export const comprehensiveBeamCatalog: BeamDimensions[] = [
  // 36" WF Series
  { id: '36wf300', designation: '36" WF 300#', depth: 36.75, webThickness: 0.9375, flangeWidth: 16.625, flangeThickness: 1.6875, weight: 300, filletRadius: 1.02 },
  { id: '36wf280', designation: '36" WF 280#', depth: 36.5, webThickness: 0.875, flangeWidth: 16.625, flangeThickness: 1.5625, weight: 280, filletRadius: 1.02 },
  { id: '36wf260', designation: '36" WF 260#', depth: 36.25, webThickness: 0.8125, flangeWidth: 16.5, flangeThickness: 1.4375, weight: 260, filletRadius: 1.02 },
  { id: '36wf245', designation: '36" WF 245#', depth: 36.125, webThickness: 0.75, flangeWidth: 16.5, flangeThickness: 1.375, weight: 245, filletRadius: 1.02 },
  { id: '36wf230', designation: '36" WF 230#', depth: 35.875, webThickness: 0.75, flangeWidth: 16.5, flangeThickness: 1.25, weight: 230, filletRadius: 1.02 },
  
  { id: '36wf194', designation: '36" WF 194#', depth: 36.5, webThickness: 0.75, flangeWidth: 12.125, flangeThickness: 1.25, weight: 194, filletRadius: 0.80 },
  { id: '36wf182', designation: '36" WF 182#', depth: 36.375, webThickness: 0.6875, flangeWidth: 12.125, flangeThickness: 1.1875, weight: 182, filletRadius: 0.80 },
  { id: '36wf170', designation: '36" WF 170#', depth: 36.25, webThickness: 0.625, flangeWidth: 12, flangeThickness: 1.125, weight: 170, filletRadius: 0.80 },
  { id: '36wf160', designation: '36" WF 160#', depth: 36, webThickness: 0.625, flangeWidth: 12, flangeThickness: 1.0, weight: 160, filletRadius: 0.80 },
  { id: '36wf150', designation: '36" WF 150#', depth: 35.875, webThickness: 0.5625, flangeWidth: 12, flangeThickness: 0.9375, weight: 150, filletRadius: 0.80 },
  
  // 33" WF Series
  { id: '33wf240', designation: '33" WF 240#', depth: 33.5, webThickness: 0.8125, flangeWidth: 15.875, flangeThickness: 1.375, weight: 240, filletRadius: 0.96 },
  { id: '33wf220', designation: '33" WF 220#', depth: 33.25, webThickness: 0.75, flangeWidth: 15.875, flangeThickness: 1.25, weight: 220, filletRadius: 0.96 },
  { id: '33wf200', designation: '33" WF 200#', depth: 33, webThickness: 0.6875, flangeWidth: 15.75, flangeThickness: 1.125, weight: 200, filletRadius: 0.96 },
  
  { id: '33wf152', designation: '33" WF 152#', depth: 33.5, webThickness: 0.625, flangeWidth: 11.625, flangeThickness: 1.0625, weight: 152, filletRadius: 0.75 },
  { id: '33wf141', designation: '33" WF 141#', depth: 33.375, webThickness: 0.5625, flangeWidth: 11.5, flangeThickness: 1.0, weight: 141, filletRadius: 0.75 },
  { id: '33wf130', designation: '33" WF 130#', depth: 33.25, webThickness: 0.5, flangeWidth: 11.5, flangeThickness: 0.875, weight: 130, filletRadius: 0.75 },
  
  // 30" WF Series
  { id: '30wf210', designation: '30" WF 210#', depth: 30.375, webThickness: 0.75, flangeWidth: 15.125, flangeThickness: 1.3125, weight: 210, filletRadius: 0.91 },
  { id: '30wf190', designation: '30" WF 190#', depth: 30.125, webThickness: 0.6875, flangeWidth: 15, flangeThickness: 1.1875, weight: 190, filletRadius: 0.91 },
  { id: '30wf172', designation: '30" WF 172#', depth: 29.875, webThickness: 0.625, flangeWidth: 15, flangeThickness: 1.0625, weight: 172, filletRadius: 0.91 },
  
  { id: '30wf132', designation: '30" WF 132#', depth: 30.25, webThickness: 0.5625, flangeWidth: 10.5625, flangeThickness: 1.0, weight: 132, filletRadius: 0.70 },
  { id: '30wf124', designation: '30" WF 124#', depth: 30.125, webThickness: 0.5, flangeWidth: 10.5, flangeThickness: 0.9375, weight: 124, filletRadius: 0.70 },
  { id: '30wf116', designation: '30" WF 116#', depth: 30, webThickness: 0.5, flangeWidth: 10.5, flangeThickness: 0.875, weight: 116, filletRadius: 0.70 },
  { id: '30wf108', designation: '30" WF 108#', depth: 29.875, webThickness: 0.4375, flangeWidth: 10.5, flangeThickness: 0.75, weight: 108, filletRadius: 0.70 },
  
  // 27" WF Series
  { id: '27wf177', designation: '27" WF 177#', depth: 27.375, webThickness: 0.6875, flangeWidth: 14.125, flangeThickness: 1.1875, weight: 177, filletRadius: 0.86 },
  { id: '27wf160', designation: '27" WF 160#', depth: 27.125, webThickness: 0.625, flangeWidth: 14, flangeThickness: 1.0625, weight: 160, filletRadius: 0.86 },
  { id: '27wf145', designation: '27" WF 145#', depth: 26.875, webThickness: 0.5625, flangeWidth: 14, flangeThickness: 0.9375, weight: 145, filletRadius: 0.86 },
  
  { id: '27wf114', designation: '27" WF 114#', depth: 27.25, webThickness: 0.5, flangeWidth: 10.125, flangeThickness: 0.9375, weight: 114, filletRadius: 0.64 },
  { id: '27wf102', designation: '27" WF 102#', depth: 27, webThickness: 0.5, flangeWidth: 10, flangeThickness: 0.8125, weight: 102, filletRadius: 0.64 },
  { id: '27wf94', designation: '27" WF 94#', depth: 26.875, webThickness: 0.4375, flangeWidth: 10, flangeThickness: 0.75, weight: 94, filletRadius: 0.64 },
  
  // 24" WF Series
  { id: '24wf160', designation: '24" WF 160#', depth: 24.625, webThickness: 0.625, flangeWidth: 14.125, flangeThickness: 1.0625, weight: 160, filletRadius: 0.70 },
  { id: '24wf145', designation: '24" WF 145#', depth: 24.375, webThickness: 0.5625, flangeWidth: 14, flangeThickness: 0.9375, weight: 145, filletRadius: 0.70 },
  { id: '24wf130', designation: '24" WF 130#', depth: 24.25, webThickness: 0.5, flangeWidth: 14, flangeThickness: 0.875, weight: 130, filletRadius: 0.70 },
  
  { id: '24wf120', designation: '24" WF 120#', depth: 24.25, webThickness: 0.5625, flangeWidth: 12.125, flangeThickness: 0.9375, weight: 120, filletRadius: 0.70 },
  { id: '24wf110', designation: '24" WF 110#', depth: 24.125, webThickness: 0.5, flangeWidth: 12, flangeThickness: 0.875, weight: 110, filletRadius: 0.70 },
  { id: '24wf100', designation: '24" WF 100#', depth: 24, webThickness: 0.4375, flangeWidth: 12, flangeThickness: 0.75, weight: 100, filletRadius: 0.70 },
  
  { id: '24wf94', designation: '24" WF 94#', depth: 24.25, webThickness: 0.5, flangeWidth: 9, flangeThickness: 0.875, weight: 94, filletRadius: 0.54 },
  { id: '24wf84', designation: '24" WF 84#', depth: 24.125, webThickness: 0.4375, flangeWidth: 9, flangeThickness: 0.75, weight: 84, filletRadius: 0.54 },
  { id: '24wf76', designation: '24" WF 76#', depth: 23.875, webThickness: 0.4375, flangeWidth: 9, flangeThickness: 0.6875, weight: 76, filletRadius: 0.54 },
  
  // 21" WF Series
  { id: '21wf142', designation: '21" WF 142#', depth: 21.5, webThickness: 0.625, flangeWidth: 13.125, flangeThickness: 1.0625, weight: 142, filletRadius: 0.65 },
  { id: '21wf127', designation: '21" WF 127#', depth: 21.25, webThickness: 0.5625, flangeWidth: 13, flangeThickness: 1.0, weight: 127, filletRadius: 0.65 },
  { id: '21wf112', designation: '21" WF 112#', depth: 21.125, webThickness: 0.5, flangeWidth: 13, flangeThickness: 0.875, weight: 112, filletRadius: 0.65 },
  
  { id: '21wf96', designation: '21" WF 96#', depth: 21.125, webThickness: 0.5625, flangeWidth: 9, flangeThickness: 0.9375, weight: 96, filletRadius: 0.65 },
  { id: '21wf82', designation: '21" WF 82#', depth: 20.875, webThickness: 0.5, flangeWidth: 9, flangeThickness: 0.8125, weight: 82, filletRadius: 0.65 },
  
  { id: '21wf73', designation: '21" WF 73#', depth: 21.25, webThickness: 0.4375, flangeWidth: 8.25, flangeThickness: 0.75, weight: 73, filletRadius: 0.58 },
  { id: '21wf68', designation: '21" WF 68#', depth: 21.125, webThickness: 0.4375, flangeWidth: 8.25, flangeThickness: 0.6875, weight: 68, filletRadius: 0.58 },
  { id: '21wf62', designation: '21" WF 62#', depth: 21, webThickness: 0.375, flangeWidth: 8.25, flangeThickness: 0.625, weight: 62, filletRadius: 0.58 },
  
  // 18" WF Series
  { id: '18wf114', designation: '18" WF 114#', depth: 18.5, webThickness: 0.5625, flangeWidth: 11.875, flangeThickness: 1.0, weight: 114, filletRadius: 0.60 },
  { id: '18wf105', designation: '18" WF 105#', depth: 18.375, webThickness: 0.5, flangeWidth: 11.875, flangeThickness: 0.9375, weight: 105, filletRadius: 0.60 },
  { id: '18wf96', designation: '18" WF 96#', depth: 18.25, webThickness: 0.5, flangeWidth: 11.875, flangeThickness: 0.875, weight: 96, filletRadius: 0.60 },
  
  { id: '18wf85', designation: '18" WF 85#', depth: 18.375, webThickness: 0.5, flangeWidth: 8.875, flangeThickness: 0.9375, weight: 85, filletRadius: 0.45 },
  { id: '18wf77', designation: '18" WF 77#', depth: 18.25, webThickness: 0.4375, flangeWidth: 8.875, flangeThickness: 0.875, weight: 77, filletRadius: 0.45 },
  { id: '18wf70', designation: '18" WF 70#', depth: 18, webThickness: 0.4375, flangeWidth: 8.75, flangeThickness: 0.75, weight: 70, filletRadius: 0.45 },
  { id: '18wf64', designation: '18" WF 64#', depth: 17.875, webThickness: 0.375, flangeWidth: 8.75, flangeThickness: 0.6875, weight: 64, filletRadius: 0.45 },
  
  { id: '18wf60', designation: '18" WF 60#', depth: 18.125, webThickness: 0.4375, flangeWidth: 7.5, flangeThickness: 0.6875, weight: 60, filletRadius: 0.43 },
  { id: '18wf55', designation: '18" WF 55#', depth: 18, webThickness: 0.375, flangeWidth: 7.5, flangeThickness: 0.625, weight: 55, filletRadius: 0.43 },
  { id: '18wf50', designation: '18" WF 50#', depth: 18, webThickness: 0.375, flangeWidth: 7.5, flangeThickness: 0.5625, weight: 50, filletRadius: 0.43 },
  
  // 16" WF Series
  { id: '16wf96', designation: '16" WF 96#', depth: 16.375, webThickness: 0.5625, flangeWidth: 11.5, flangeThickness: 0.875, weight: 96, filletRadius: 0.60 },
  { id: '16wf88', designation: '16" WF 88#', depth: 16.25, webThickness: 0.5, flangeWidth: 11.5, flangeThickness: 0.8125, weight: 88, filletRadius: 0.60 },
  
  { id: '16wf78', designation: '16" WF 78#', depth: 16.375, webThickness: 0.5, flangeWidth: 8.625, flangeThickness: 0.875, weight: 78, filletRadius: 0.50 },
  { id: '16wf71', designation: '16" WF 71#', depth: 16.25, webThickness: 0.4375, flangeWidth: 8.625, flangeThickness: 0.8125, weight: 71, filletRadius: 0.50 },
  { id: '16wf64', designation: '16" WF 64#', depth: 16.125, webThickness: 0.4375, flangeWidth: 8.5, flangeThickness: 0.6875, weight: 64, filletRadius: 0.50 },
  { id: '16wf58', designation: '16" WF 58#', depth: 15.875, webThickness: 0.375, flangeWidth: 8.5, flangeThickness: 0.625, weight: 58, filletRadius: 0.50 },
  
  { id: '16wf50', designation: '16" WF 50#', depth: 16.25, webThickness: 0.375, flangeWidth: 7.125, flangeThickness: 0.625, weight: 50, filletRadius: 0.43 },
  { id: '16wf45', designation: '16" WF 45#', depth: 16.125, webThickness: 0.3125, flangeWidth: 7, flangeThickness: 0.5625, weight: 45, filletRadius: 0.43 },
  { id: '16wf40', designation: '16" WF 40#', depth: 16, webThickness: 0.3125, flangeWidth: 7, flangeThickness: 0.5, weight: 40, filletRadius: 0.43 },
  { id: '16wf36', designation: '16" WF 36#', depth: 15.875, webThickness: 0.3125, flangeWidth: 7, flangeThickness: 0.4375, weight: 36, filletRadius: 0.43 },
  
  // 14" WF Series (including large sizes)
  { id: '14wf426', designation: '14" WF 426#', depth: 18.625, webThickness: 2.1875, flangeWidth: 16.75, flangeThickness: 3.0625, weight: 426, filletRadius: 1.25 },
  { id: '14wf398', designation: '14" WF 398#', depth: 18.25, webThickness: 2.0625, flangeWidth: 16.625, flangeThickness: 2.8125, weight: 398, filletRadius: 1.25 },
  { id: '14wf370', designation: '14" WF 370#', depth: 18, webThickness: 1.875, flangeWidth: 16.5, flangeThickness: 2.625, weight: 370, filletRadius: 1.25 },
  { id: '14wf342', designation: '14" WF 342#', depth: 17.625, webThickness: 1.75, flangeWidth: 16.375, flangeThickness: 2.4375, weight: 342, filletRadius: 1.25 },
  { id: '14wf314', designation: '14" WF 314#', depth: 17.25, webThickness: 1.625, flangeWidth: 16.25, flangeThickness: 2.25, weight: 314, filletRadius: 1.25 },
  { id: '14wf287', designation: '14" WF 287#', depth: 16.875, webThickness: 1.4375, flangeWidth: 16.125, flangeThickness: 2.0625, weight: 287, filletRadius: 1.25 },
  { id: '14wf264', designation: '14" WF 264#', depth: 16.5, webThickness: 1.375, flangeWidth: 16, flangeThickness: 1.875, weight: 264, filletRadius: 1.25 },
  { id: '14wf246', designation: '14" WF 246#', depth: 16.25, webThickness: 1.25, flangeWidth: 16, flangeThickness: 1.75, weight: 246, filletRadius: 1.25 },
  { id: '14wf237', designation: '14" WF 237#', depth: 16.125, webThickness: 1.1875, flangeWidth: 15.875, flangeThickness: 1.6875, weight: 237, filletRadius: 1.25 },
  { id: '14wf228', designation: '14" WF 228#', depth: 16, webThickness: 1.125, flangeWidth: 15.875, flangeThickness: 1.625, weight: 228, filletRadius: 1.25 },
  { id: '14wf219', designation: '14" WF 219#', depth: 15.875, webThickness: 1.0625, flangeWidth: 15.75, flangeThickness: 1.5625, weight: 219, filletRadius: 1.25 },
  { id: '14wf211', designation: '14" WF 211#', depth: 15.75, webThickness: 1.0, flangeWidth: 15.75, flangeThickness: 1.5, weight: 211, filletRadius: 1.25 },
  { id: '14wf202', designation: '14" WF 202#', depth: 15.625, webThickness: 0.9375, flangeWidth: 15.625, flangeThickness: 1.4375, weight: 202, filletRadius: 1.25 },
  { id: '14wf193', designation: '14" WF 193#', depth: 15.5, webThickness: 0.875, flangeWidth: 15.625, flangeThickness: 1.375, weight: 193, filletRadius: 1.25 },
  { id: '14wf184', designation: '14" WF 184#', depth: 15.375, webThickness: 0.8125, flangeWidth: 15.625, flangeThickness: 1.3125, weight: 184, filletRadius: 1.25 },
  { id: '14wf176', designation: '14" WF 176#', depth: 15.25, webThickness: 0.8125, flangeWidth: 15.625, flangeThickness: 1.25, weight: 176, filletRadius: 1.25 },
  { id: '14wf167', designation: '14" WF 167#', depth: 15.125, webThickness: 0.75, flangeWidth: 15.625, flangeThickness: 1.1875, weight: 167, filletRadius: 1.25 },
  { id: '14wf158', designation: '14" WF 158#', depth: 15, webThickness: 0.6875, flangeWidth: 15.5, flangeThickness: 1.125, weight: 158, filletRadius: 1.25 },
  { id: '14wf150', designation: '14" WF 150#', depth: 14.875, webThickness: 0.6875, flangeWidth: 15.5, flangeThickness: 1.0625, weight: 150, filletRadius: 1.25 },
  { id: '14wf142', designation: '14" WF 142#', depth: 14.75, webThickness: 0.625, flangeWidth: 15.5, flangeThickness: 1.0, weight: 142, filletRadius: 1.25 },
  { id: '14wf136', designation: '14" WF 136#', depth: 14.75, webThickness: 0.625, flangeWidth: 14.625, flangeThickness: 1.0625, weight: 136, filletRadius: 1.00 },
  { id: '14wf127', designation: '14" WF 127#', depth: 14.625, webThickness: 0.5625, flangeWidth: 14.625, flangeThickness: 1.0, weight: 127, filletRadius: 1.00 },
  { id: '14wf119', designation: '14" WF 119#', depth: 14.5, webThickness: 0.5625, flangeWidth: 14.625, flangeThickness: 0.9375, weight: 119, filletRadius: 1.00 },
  { id: '14wf111', designation: '14" WF 111#', depth: 14.375, webThickness: 0.5, flangeWidth: 14.625, flangeThickness: 0.875, weight: 111, filletRadius: 1.00 },
  { id: '14wf103', designation: '14" WF 103#', depth: 14.25, webThickness: 0.4375, flangeWidth: 14.5, flangeThickness: 0.8125, weight: 103, filletRadius: 1.00 },
  { id: '14wf95', designation: '14" WF 95#', depth: 14.125, webThickness: 0.4375, flangeWidth: 14.5, flangeThickness: 0.75, weight: 95, filletRadius: 1.00 },
  { id: '14wf87', designation: '14" WF 87#', depth: 14, webThickness: 0.375, flangeWidth: 14.5, flangeThickness: 0.6875, weight: 87, filletRadius: 1.00 },
  
  { id: '14wf84', designation: '14" WF 84#', depth: 14.125, webThickness: 0.4375, flangeWidth: 12, flangeThickness: 0.75, weight: 84, filletRadius: 0.60 },
  { id: '14wf78', designation: '14" WF 78#', depth: 14, webThickness: 0.4375, flangeWidth: 12, flangeThickness: 0.6875, weight: 78, filletRadius: 0.60 },
  
  { id: '14wf74', designation: '14" WF 74#', depth: 14.125, webThickness: 0.4375, flangeWidth: 10.125, flangeThickness: 0.75, weight: 74, filletRadius: 0.60 },
  { id: '14wf68', designation: '14" WF 68#', depth: 14, webThickness: 0.4375, flangeWidth: 10, flangeThickness: 0.6875, weight: 68, filletRadius: 0.60 },
  { id: '14wf61', designation: '14" WF 61#', depth: 13.875, webThickness: 0.375, flangeWidth: 10, flangeThickness: 0.625, weight: 61, filletRadius: 0.60 },
  
  { id: '14wf53', designation: '14" WF 53#', depth: 13.875, webThickness: 0.375, flangeWidth: 8, flangeThickness: 0.625, weight: 53, filletRadius: 0.60 },
  { id: '14wf48', designation: '14" WF 48#', depth: 13.75, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.5625, weight: 48, filletRadius: 0.60 },
  { id: '14wf43', designation: '14" WF 43#', depth: 13.625, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.5, weight: 43, filletRadius: 0.60 },
  
  { id: '14wf38', designation: '14" WF 38#', depth: 14.125, webThickness: 0.3125, flangeWidth: 6.75, flangeThickness: 0.5, weight: 38, filletRadius: 0.43 },
  { id: '14wf34', designation: '14" WF 34#', depth: 14, webThickness: 0.3125, flangeWidth: 6.75, flangeThickness: 0.4375, weight: 34, filletRadius: 0.43 },
  { id: '14wf30', designation: '14" WF 30#', depth: 13.875, webThickness: 0.25, flangeWidth: 6.75, flangeThickness: 0.375, weight: 30, filletRadius: 0.43 },
  
  // 12" WF Series
  { id: '12wf190', designation: '12" WF 190#', depth: 14.375, webThickness: 1.0625, flangeWidth: 12.625, flangeThickness: 1.6875, weight: 190, filletRadius: 0.90 },
  { id: '12wf161', designation: '12" WF 161#', depth: 13.875, webThickness: 0.875, flangeWidth: 12.5, flangeThickness: 1.4375, weight: 161, filletRadius: 0.90 },
  { id: '12wf133', designation: '12" WF 133#', depth: 13.375, webThickness: 0.75, flangeWidth: 12.375, flangeThickness: 1.1875, weight: 133, filletRadius: 0.90 },
  { id: '12wf120', designation: '12" WF 120#', depth: 13.125, webThickness: 0.6875, flangeWidth: 12.3125, flangeThickness: 1.0625, weight: 120, filletRadius: 0.90 },
  { id: '12wf106', designation: '12" WF 106#', depth: 12.875, webThickness: 0.5625, flangeWidth: 12.25, flangeThickness: 0.9375, weight: 106, filletRadius: 0.90 },
  { id: '12wf99', designation: '12" WF 99#', depth: 12.75, webThickness: 0.5625, flangeWidth: 12.1875, flangeThickness: 0.875, weight: 99, filletRadius: 0.90 },
  { id: '12wf92', designation: '12" WF 92#', depth: 12.625, webThickness: 0.5, flangeWidth: 12.125, flangeThickness: 0.8125, weight: 92, filletRadius: 0.90 },
  { id: '12wf85', designation: '12" WF 85#', depth: 12.5, webThickness: 0.4375, flangeWidth: 12.125, flangeThickness: 0.75, weight: 85, filletRadius: 0.90 },
  { id: '12wf79', designation: '12" WF 79#', depth: 12.375, webThickness: 0.4375, flangeWidth: 12.0625, flangeThickness: 0.6875, weight: 79, filletRadius: 0.90 },
  { id: '12wf72', designation: '12" WF 72#', depth: 12.25, webThickness: 0.375, flangeWidth: 12, flangeThickness: 0.625, weight: 72, filletRadius: 0.90 },
  { id: '12wf65', designation: '12" WF 65#', depth: 12.125, webThickness: 0.375, flangeWidth: 12, flangeThickness: 0.5625, weight: 65, filletRadius: 0.90 },
  
  { id: '12wf58', designation: '12" WF 58#', depth: 12.125, webThickness: 0.375, flangeWidth: 10, flangeThickness: 0.625, weight: 58, filletRadius: 0.60 },
  { id: '12wf53', designation: '12" WF 53#', depth: 12, webThickness: 0.3125, flangeWidth: 10, flangeThickness: 0.5625, weight: 53, filletRadius: 0.60 },
  
  { id: '12wf50', designation: '12" WF 50#', depth: 12.125, webThickness: 0.375, flangeWidth: 8.125, flangeThickness: 0.625, weight: 50, filletRadius: 0.60 },
  { id: '12wf45', designation: '12" WF 45#', depth: 12, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.5625, weight: 45, filletRadius: 0.60 },
  { id: '12wf40', designation: '12" WF 40#', depth: 12, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.5, weight: 40, filletRadius: 0.60 },
  
  { id: '12wf36', designation: '12" WF 36#', depth: 12.25, webThickness: 0.3125, flangeWidth: 6.5625, flangeThickness: 0.5, weight: 36, filletRadius: 0.37 },
  { id: '12wf31', designation: '12" WF 31#', depth: 12.125, webThickness: 0.25, flangeWidth: 6.5, flangeThickness: 0.4375, weight: 31, filletRadius: 0.37 },
  { id: '12wf27', designation: '12" WF 27#', depth: 12, webThickness: 0.25, flangeWidth: 6.5, flangeThickness: 0.375, weight: 27, filletRadius: 0.37 },
  
  // 10" WF Series
  { id: '10wf112', designation: '10" WF 112#', depth: 11.375, webThickness: 0.75, flangeWidth: 10.375, flangeThickness: 1.25, weight: 112, filletRadius: 0.80 },
  { id: '10wf100', designation: '10" WF 100#', depth: 11.125, webThickness: 0.625, flangeWidth: 10.375, flangeThickness: 1.125, weight: 100, filletRadius: 0.80 },
  { id: '10wf89', designation: '10" WF 89#', depth: 10.875, webThickness: 0.625, flangeWidth: 10.25, flangeThickness: 1.0, weight: 89, filletRadius: 0.80 },
  { id: '10wf77', designation: '10" WF 77#', depth: 10.625, webThickness: 0.5, flangeWidth: 10.25, flangeThickness: 0.875, weight: 77, filletRadius: 0.80 },
  { id: '10wf72', designation: '10" WF 72#', depth: 10.5, webThickness: 0.5, flangeWidth: 10.1875, flangeThickness: 0.8125, weight: 72, filletRadius: 0.80 },
  { id: '10wf66', designation: '10" WF 66#', depth: 10.375, webThickness: 0.4375, flangeWidth: 10.125, flangeThickness: 0.75, weight: 66, filletRadius: 0.80 },
  { id: '10wf60', designation: '10" WF 60#', depth: 10.25, webThickness: 0.4375, flangeWidth: 10.0625, flangeThickness: 0.6875, weight: 60, filletRadius: 0.80 },
  { id: '10wf54', designation: '10" WF 54#', depth: 10.125, webThickness: 0.375, flangeWidth: 10, flangeThickness: 0.625, weight: 54, filletRadius: 0.80 },
  { id: '10wf49', designation: '10" WF 49#', depth: 10, webThickness: 0.375, flangeWidth: 10, flangeThickness: 0.5625, weight: 49, filletRadius: 0.80 },
  
  { id: '10wf45', designation: '10" WF 45#', depth: 10.125, webThickness: 0.375, flangeWidth: 8, flangeThickness: 0.625, weight: 45, filletRadius: 0.50 },
  { id: '10wf39', designation: '10" WF 39#', depth: 10, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.5625, weight: 39, filletRadius: 0.50 },
  { id: '10wf33', designation: '10" WF 33#', depth: 9.75, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.4375, weight: 33, filletRadius: 0.50 },
  
  { id: '10wf29', designation: '10" WF 29#', depth: 10.25, webThickness: 0.3125, flangeWidth: 5.75, flangeThickness: 0.5, weight: 29, filletRadius: 0.32 },
  { id: '10wf25', designation: '10" WF 25#', depth: 10.125, webThickness: 0.25, flangeWidth: 5.75, flangeThickness: 0.4375, weight: 25, filletRadius: 0.32 },
  { id: '10wf21', designation: '10" WF 21#', depth: 9.875, webThickness: 0.25, flangeWidth: 5.75, flangeThickness: 0.375, weight: 21, filletRadius: 0.32 },
  
  // 8" WF Series
  { id: '8wf67', designation: '8" WF 67#', depth: 9, webThickness: 0.5625, flangeWidth: 8.25, flangeThickness: 0.9375, weight: 67, filletRadius: 0.40 },
  { id: '8wf58', designation: '8" WF 58#', depth: 8.75, webThickness: 0.5, flangeWidth: 8.25, flangeThickness: 0.8125, weight: 58, filletRadius: 0.40 },
  { id: '8wf48', designation: '8" WF 48#', depth: 8.5, webThickness: 0.375, flangeWidth: 8.125, flangeThickness: 0.6875, weight: 48, filletRadius: 0.40 },
  { id: '8wf40', designation: '8" WF 40#', depth: 8.25, webThickness: 0.375, flangeWidth: 8.0625, flangeThickness: 0.5625, weight: 40, filletRadius: 0.40 },
  { id: '8wf35', designation: '8" WF 35#', depth: 8.125, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.5, weight: 35, filletRadius: 0.40 },
  { id: '8wf31', designation: '8" WF 31#', depth: 8, webThickness: 0.3125, flangeWidth: 8, flangeThickness: 0.4375, weight: 31, filletRadius: 0.40 },
  
  { id: '8wf28', designation: '8" WF 28#', depth: 8, webThickness: 0.3125, flangeWidth: 6.5, flangeThickness: 0.4375, weight: 28, filletRadius: 0.40 },
  { id: '8wf24', designation: '8" WF 24#', depth: 7.875, webThickness: 0.25, flangeWidth: 6.5, flangeThickness: 0.375, weight: 24, filletRadius: 0.40 },
  
  { id: '8wf20', designation: '8" WF 20#', depth: 8.125, webThickness: 0.25, flangeWidth: 5.25, flangeThickness: 0.375, weight: 20, filletRadius: 0.32 },
  { id: '8wf17', designation: '8" WF 17#', depth: 8, webThickness: 0.25, flangeWidth: 5.25, flangeThickness: 0.3125, weight: 17, filletRadius: 0.32 }
]