import React from "react";
import { HeaderLayout, ContentLayout, Box } from "@strapi/design-system";
import { useIntl } from "react-intl";
import pluginId from "../../../pluginId";

import { Formik, Form } from "formik";
import { useHeadTypes } from "../../../lib/queries/head-type";

type Inputs = {
  name: string;
  type?: string;
  fields?: {
    key: string;
    value: string;
  }[];
};

const CreateHeadsPage = () => {
  const { formatMessage } = useIntl();
  const { data: headTypes } = useHeadTypes();
  console.log(headTypes);
  const initialValues: Inputs = {
    name: "",
  };

  const onSubmit = async (values: Inputs) => {};

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {({
        handleSubmit,
        values,
        handleChange,
        errors,
        touched,
        isSubmitting,
        setFieldValue,
      }) => (
        <Form onSubmit={handleSubmit}>
          <HeaderLayout
            title={formatMessage({
              id: `${pluginId}.settings.page.heads.create.title`,
              defaultMessage: "Create a new head",
            })}
            subtitle={formatMessage({
              id: `${pluginId}.settings.page.heads.create.description`,
              defaultMessage:
                "Define endpoints and settings for the heads of this application",
            })}
          />
          <ContentLayout>
            <Box></Box>
          </ContentLayout>
        </Form>
      )}
    </Formik>
  );
};

export default CreateHeadsPage;
