"use strict";

/**
 * @Route("GET /parameters")
 * @Route("POST /parameters")
 * @Query("page", type="int", default=1)
 * @Query("start", type="int", alias="offset")
 * @Header("X-Test", alias="testHeader")
 * @Cookie("session", type="string", alias="sessionId")
 * @Post("name", type="string")
 * @Post("num", type="int", alias="number")
 * @Post("bool", type="bool")
 * @Post("uuid", type="uuid")
 * @Post(alias="postData")
 */
class ParametersRoute {
  process(page, offset, testHeader, sessionId, name, number, bool, uuid, postData) {
    return {
      page: page,
      offset: offset,
      testHeader: testHeader,
      sessionId: sessionId,
      name: name,
      number: number,
      bool: bool,
      uuid: uuid,
      postData: postData
    };
  }
}

module.exports = ParametersRoute;
